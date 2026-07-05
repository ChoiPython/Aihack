// 실제 백엔드 API(/api/companies, /api/policies)를 호출해 BEPA 청년친화강소기업
// 데이터베이스에서 기업을 검색(Retrieval)하고, 사용자 우선순위에 맞춰 클라이언트에서
// 재정렬한 뒤, /api/recommend(Gemini)로 추천 이유를 배치 생성한다(Generation).
// TODO: AI/RAG 담당의 벡터 검색(lib/ai)이 /api/companies에 연결되면 이 키워드 기반
// 재정렬은 벡터 유사도 결과를 그대로 신뢰하는 방식으로 단순화할 수 있다 (PRD 14.4).

import {
  clampScore,
  normalizeSalary,
  normalizeWorkLifeBalance,
  normalizeWelfare,
  normalizeGrowth,
  PRIORITY_WEIGHTS,
} from '../utils/scoreFormatter'
import { getPoliciesForCompany } from './policyMatcher'

// Gemini 호출은 서버리스 함수(api/recommend.js)로 이전됨 — API 키가
// 브라우저에 노출되지 않도록 fetch로 서버를 거쳐서 추천 이유를 받는다.
async function generateRecommendationReasons(userProfile, companies) {
  const response = await fetch('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userProfile, companies }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`추천 이유 생성 API 오류 (${response.status}): ${errText}`)
  }

  return response.json()
}

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
      if (companyToken.includes(userToken) || userToken.includes(companyToken)) {
        matched.push(companyToken)
      }
    }
  }
  return [...new Set(matched)]
}

// /api/companies?q=는 벡터 검색이 아니라 단일 컬럼 ILIKE('%q%') 매칭이라
// 문장을 통째로 보내면 어떤 컬럼과도 안 맞아 0건이 된다. 그래서 industry/location처럼
// 실제 컬럼 값과 정확히 겹치는 짧은 term으로 나눠 검색한 뒤 결과를 합친다.
// freeText는 검색 자체가 아니라 이후 scoreCompany의 재정렬/이유 생성에만 사용한다.
async function fetchCandidateCompanies(userProfile) {
  const { industry = '', location = '' } = userProfile
  const terms = [industry, location && location !== '부산 전체' ? location : ''].filter(Boolean)

  const results = await Promise.all(
    terms.map(async (term) => {
      const res = await fetch(`/api/companies?q=${encodeURIComponent(term)}`)
      if (!res.ok) throw new Error(`기업 검색 실패 (${res.status})`)
      const { companies } = await res.json()
      return companies
    }),
  )

  const merged = new Map()
  for (const list of results) {
    for (const company of list) merged.set(company.id, company)
  }
  return [...merged.values()]
}

// 사용자 입력과 기업 데이터를 비교해 적합도(0~100)와 매칭 근거를 계산한다.
function scoreCompany(company, userProfile) {
  const { industry = '', location = '', benefits = [], freeText = '', priority } = userProfile

  const userFreeTextTokens = tokenize(freeText)

  const industryMatch = company.industry && company.industry === industry ? [company.industry] : []
  const locationMatch =
    location && (location === '부산 전체' || company.region === location) ? [company.region] : []
  // companies.category(급여/워라밸/복지/미래)가 선택한 우선순위와 같으면
  // BEPA가 이미 그 부문에서 인증한 기업이라는 뜻이라 강한 신호로 취급한다.
  const categoryMatch = company.category === priority ? [company.category] : []

  const detailText = [company.welfare_detail, company.worklife_balance_detail, company.training_detail]
    .filter(Boolean)
    .join(' ')
  const benefitMatch = benefits.filter((benefit) => detailText.includes(benefit))

  const freeTextMatch = overlaps(
    userFreeTextTokens,
    [company.industry, company.category, company.company_size, company.products_services, company.certifications].filter(
      Boolean,
    ),
  )

  const matchingKeywords = [
    ...new Set([...categoryMatch, ...industryMatch, ...locationMatch, ...benefitMatch, ...freeTextMatch]),
  ]

  const overlapCount =
    categoryMatch.length * 3 + industryMatch.length * 2 + locationMatch.length * 2 + benefitMatch.length + freeTextMatch.length
  const matchDimensionScore = clampScore((overlapCount / 6) * 100)

  const weights = PRIORITY_WEIGHTS[priority] || PRIORITY_WEIGHTS['워라밸']
  const finalScore = clampScore(
    normalizeSalary(company.avg_annual_salary) * weights.salary +
      normalizeWorkLifeBalance(company.worklife_balance_score) * weights.workLifeBalance +
      normalizeWelfare(company.welfare_score) * weights.welfare +
      normalizeGrowth(company.training_score) * weights.growth +
      matchDimensionScore * weights.match,
  )

  const dynamicReasons = []
  if (categoryMatch.length) dynamicReasons.push(`BEPA 인증 부문(${company.category})이 선택하신 우선순위와 일치`)
  if (industryMatch.length) dynamicReasons.push(`관심 산업과 일치: ${company.industry}`)
  if (locationMatch.length) dynamicReasons.push(`근무 희망 지역과 일치: ${company.region}`)
  if (benefitMatch.length) dynamicReasons.push(`선호 복지와 관련된 제도 보유: ${benefitMatch.join(', ')}`)
  if (freeTextMatch.length) dynamicReasons.push(`자유 입력 내용과 관련된 키워드: ${freeTextMatch.join(', ')}`)

  return { finalScore, matchingKeywords, reasons: dynamicReasons }
}

/**
 * 사용자 프로필을 받아 Top-K 추천 기업 목록을 반환한다.
 * 1) /api/companies?q=로 후보 기업을 검색하고, 우선순위 기준으로 클라이언트에서 재정렬 (검색/Retrieval)
 * 2) Top-K 후보를 /api/recommend(Gemini)에 배치로 넘겨 추천 이유를 생성한다 (생성/Generation).
 * 검색 결과가 없으면 빈 배열을 반환해 Empty State로 이어지고, API/Gemini 호출이 실패하면
 * 에러를 그대로 던져 호출부(HomePage)가 에러 상태를 보여주게 한다.
 */
export async function getRecommendations(userProfile, topK = 5) {
  const companies = await fetchCandidateCompanies(userProfile)

  const topCompanies = companies
    .map((company) => {
      const { finalScore, matchingKeywords, reasons } = scoreCompany(company, userProfile)
      return { ...company, matchScore: finalScore, matchingKeywords, reasons }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, topK)

  if (topCompanies.length === 0) return []

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
