// RAG 파이프라인의 "검색(Retrieval) + 생성(Generation)" 단계 중 검색 단계는 아직 mock이다.
// 실제 서비스에서는 사용자 입력을 embedding해 vector DB(Chroma/FAISS)에서 Top-K를 검색하지만,
// 지금은 백엔드가 없으므로 mockCompanies.js를 "vector DB 검색 결과"처럼 다루고 키워드 겹침으로 스코어링한다.
// 생성 단계(추천 이유 생성)는 실제 Gemini API를 호출한다 (geminiClient.js).

import { mockCompanies } from '../data/mockCompanies'
import { clampScore, PRIORITY_WEIGHTS } from '../utils/scoreFormatter'
import { getPoliciesForCompany } from './policyMatcher'
import { generateRecommendationReasons } from './geminiClient'

function tokenize(value) {
  if (!value) return []
  return String(value)
    .split(/[,\s/·|]+/)
    .map((token) => token.trim())
    .filter(Boolean)
}

function overlaps(userTokens, companyTokens) {
  const matched = []
  for (const userToken of userTokens) {
    for (const companyToken of companyTokens) {
      if (
        companyToken.includes(userToken) ||
        userToken.includes(companyToken)
      ) {
        matched.push(companyToken)
      }
    }
  }
  return [...new Set(matched)]
}

// 사용자 입력과 기업 데이터를 비교해 차원별 적합도(0~100)와 매칭 근거를 계산한다.
function scoreCompany(company, userProfile) {
  const {
    industry = '',
    jobRole = '',
    skills = '',
    location = '',
    benefits = [],
    freeText = '',
  } = userProfile

  const userSkillTokens = tokenize(skills)
  const userFreeTextTokens = tokenize(freeText)
  const userIndustryTokens = tokenize(industry)
  const userJobTokens = tokenize(jobRole)

  const industryMatch = overlaps(userIndustryTokens, [company.industry, ...company.keywords])
  const jobMatch = overlaps(userJobTokens, company.jobs)
  const skillMatch = overlaps(userSkillTokens, company.skillsWanted)
  const locationMatch =
    location && (location === '부산 전체' || company.location.includes(location)) ? [company.location] : []
  const benefitMatch = overlaps(benefits, company.benefits)
  const freeTextMatch = overlaps(userFreeTextTokens, [
    ...company.keywords,
    ...company.skillsWanted,
    company.industry,
  ])

  const matchingKeywords = [
    ...new Set([...industryMatch, ...jobMatch, ...skillMatch, ...locationMatch, ...benefitMatch, ...freeTextMatch]),
  ]

  // 직무적합성(match) 차원 점수: 겹친 항목 수에 비례, 5개 이상 겹치면 만점
  const overlapCount =
    industryMatch.length * 2 + jobMatch.length * 2 + skillMatch.length * 2 + locationMatch.length + benefitMatch.length + freeTextMatch.length
  const matchDimensionScore = clampScore((overlapCount / 8) * 100)

  const weights = PRIORITY_WEIGHTS[userProfile.priority] || PRIORITY_WEIGHTS['직무적합성']
  const weightedScore =
    company.growthPotential * 20 * weights.growthPotential +
    company.stability * 20 * weights.stability +
    company.salaryLevel * 20 * weights.salaryLevel +
    company.workLifeBalance * 20 * weights.workLifeBalance +
    matchDimensionScore * weights.match

  // 데모 안정성을 위해 baseline matchScore(설계된 예시값)와 30:70으로 블렌딩
  const finalScore = clampScore(weightedScore * 0.7 + company.matchScore * 0.3)

  const dynamicReasons = []
  if (industryMatch.length) dynamicReasons.push(`관심 산업과 일치하는 키워드: ${industryMatch.join(', ')}`)
  if (jobMatch.length) dynamicReasons.push(`희망 직무와 일치: ${jobMatch.join(', ')}`)
  if (skillMatch.length) dynamicReasons.push(`보유 기술 스택과 일치: ${skillMatch.join(', ')}`)
  if (locationMatch.length) dynamicReasons.push(`근무 희망 지역과 일치: ${locationMatch.join(', ')}`)
  if (benefitMatch.length) dynamicReasons.push(`선호 복지와 일치: ${benefitMatch.join(', ')}`)
  if (freeTextMatch.length) dynamicReasons.push(`자유 입력 내용과 관련된 키워드: ${freeTextMatch.join(', ')}`)

  return {
    finalScore,
    matchingKeywords,
    reasons: dynamicReasons.length ? dynamicReasons : company.reasons,
  }
}

/**
 * 사용자 프로필을 받아 Top-K 추천 기업 목록을 반환한다.
 * 1) mockCompanies를 "vector DB 검색 결과"처럼 키워드 겹침으로 스코어링·정렬하고 (검색/Retrieval)
 * 2) Top-K 후보를 Gemini에 배치로 넘겨 추천 이유를 생성한다 (생성/Generation).
 * Gemini 호출이 실패하면 에러를 그대로 던져 호출부(HomePage)가 에러 상태를 보여주게 한다.
 */
export async function getRecommendations(userProfile, topK = 5) {
  const topCompanies = mockCompanies
    .map((company) => {
      const { finalScore, matchingKeywords, reasons } = scoreCompany(company, userProfile)
      return { ...company, matchScore: finalScore, matchingKeywords, reasons }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, topK)

  // 정책은 실제 DB(/api/policies)에서 지역 기준으로 조회하고(실패 시 로컬 mock으로 대체),
  // 추천 이유는 Gemini로 배치 생성한다 — 두 호출은 서로 무관하니 병렬로 처리한다.
  const [aiReasons, withPolicies] = await Promise.all([
    generateRecommendationReasons(userProfile, topCompanies),
    Promise.all(
      topCompanies.map(async (company) => ({
        ...company,
        policies: await getPoliciesForCompany(company),
      })),
    ),
  ])

  const reasonsById = new Map(aiReasons.map((entry) => [entry.id, entry.reasons]))

  return withPolicies.map((company) => ({
    ...company,
    reasons: reasonsById.get(company.id)?.length ? reasonsById.get(company.id) : company.reasons,
  }))
}
