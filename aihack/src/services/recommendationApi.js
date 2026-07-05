// RAG 파이프라인: 검색(Retrieval)은 /api/companies(임베딩 + ChromaDB 벡터 검색,
// 실패 시 키워드 폴백)를 호출하고, 생성(Generation)은 /api/recommend(Gemini)를 호출한다.
// RecommendationCard.jsx 등 화면 컴포넌트는 mock 시절 필드(jobs, evidenceChunks,
// financialHealth 등)를 그대로 기대하므로, 실제 DB 필드로부터 이 필드들을
// 최대한 사실 기반으로 합성하는 어댑터(adaptCompanyRow)를 거쳐서 넘긴다.

import { clampScore } from '../utils/scoreFormatter'
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

// 사용자 입력을 하나의 자연어 검색어로 합쳐 /api/companies에 넘긴다.
function buildSearchQuery(userProfile) {
  const parts = [
    userProfile.freeText,
    userProfile.industry,
    userProfile.jobRole,
    userProfile.skills,
    userProfile.location,
    (userProfile.benefits || []).join(' '),
  ].filter(Boolean)
  return parts.join(' ') || '기업 추천'
}

// companies 테이블 실제 컬럼 중 텍스트성 필드에서 사용자 입력과 겹치는 키워드를 뽑는다.
function buildMatchingKeywords(row, userProfile) {
  const userTokens = [
    ...tokenize(userProfile.industry),
    ...tokenize(userProfile.jobRole),
    ...tokenize(userProfile.skills),
    ...tokenize(userProfile.location),
    ...tokenize(userProfile.freeText),
    ...(userProfile.benefits || []),
  ]
  const companyTokens = [row.industry, row.category, row.region, row.products_services, row.certifications].filter(
    Boolean,
  )
  return overlaps(userTokens, companyTokens)
}

// worklife_balance_detail/welfare_detail/training_detail을 "근거 문서"처럼 노출한다 — 실제 DB 텍스트이므로 지어내지 않는다.
function buildEvidenceChunks(row) {
  return [
    { source: '워라밸 데이터', text: row.worklife_balance_detail },
    { source: '복지 데이터', text: row.welfare_detail },
    { source: '교육/훈련 데이터', text: row.training_detail },
  ].filter((chunk) => chunk.text)
}

// revenue/employee_* 실데이터가 있으면 그 수치를 그대로 보여주고, 없으면 '정보 없음' 처리한다.
function buildFinancialHealth(row) {
  const parts = []
  if (row.revenue != null) parts.push(`연매출 ${row.revenue}`)
  if (row.employee_total != null) parts.push(`전체 임직원 ${row.employee_total}명`)
  if (row.employee_regular != null) parts.push(`정규직 ${row.employee_regular}명`)

  return {
    rating: parts.length ? '실데이터 기반' : '정보 없음',
    detail: parts.length ? parts.join(' · ') : '재무 정보가 아직 없습니다.',
  }
}

function buildRecommendedStrategy(row, userProfile) {
  const priority = userProfile.priority || '직무적합성'
  return `${row.name}은(는) ${priority}을(를) 중요하게 보는 지원자에게 적합합니다. 자기소개서에 관련 경험을 구체적으로 연결해서 작성해보세요.`
}

// /api/companies가 반환하는 실제 DB row를 RecommendationCard.jsx가 기대하는 화면 모델로 변환한다.
// location/jobs/evidenceChunks/financialHealth/recommendedStrategy는 실제 스키마에 없는
// mock 전용 필드라 여기서 사실 기반으로 합성하고, 대응하는 실데이터가 없는 것(jobs)은 빈 배열로 둔다.
function adaptCompanyRow(row, userProfile) {
  return {
    ...row,
    location: row.region ?? '지역 미상',
    jobs: [],
    matchScore: row.similarity != null ? clampScore(row.similarity * 100) : 70,
    matchingKeywords: buildMatchingKeywords(row, userProfile),
    reasons: [],
    evidenceChunks: buildEvidenceChunks(row),
    recommendedStrategy: buildRecommendedStrategy(row, userProfile),
    financialHealth: buildFinancialHealth(row),
  }
}

/**
 * 사용자 프로필을 받아 Top-K 추천 기업 목록을 반환한다.
 * 1) /api/companies로 벡터 검색(실패 시 키워드 폴백)된 Top-K 기업을 가져오고 (검색/Retrieval)
 * 2) Top-K 후보를 /api/recommend(Gemini)에 배치로 넘겨 추천 이유를 생성한다 (생성/Generation).
 * 검색/생성 API가 실패하면 에러를 그대로 던져 호출부(HomePage)가 에러 상태를 보여주게 한다.
 */
export async function getRecommendations(userProfile, topK = 5) {
  const query = buildSearchQuery(userProfile)
  const searchRes = await fetch(`/api/companies?q=${encodeURIComponent(query)}`)
  if (!searchRes.ok) {
    const errText = await searchRes.text()
    throw new Error(`기업 검색 API 오류 (${searchRes.status}): ${errText}`)
  }

  const { companies } = await searchRes.json()
  const topCompanies = companies.slice(0, topK).map((row) => adaptCompanyRow(row, userProfile))

  if (topCompanies.length === 0) return []

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
