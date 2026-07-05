// 기업의 지역(location)과 정책의 targetRegion을 비교해 관련 청년 지원정책을 찾는다.
// PRD 13.2 설계 노트대로 companies ↔ policies는 고정 FK로 연결하지 않고,
// 추천 시점에 지역 기준으로만 매칭한다. 자격요건(연령·취업상태)은 로그인이 없어
// 자동 판정할 수 없으므로 텍스트로 안내하고 사용자가 스스로 확인하도록 한다.

import { mockPolicies } from '../data/mockPolicies'

export function getMatchingPolicies(company, limit = 3) {
  const matched = mockPolicies.filter(
    (policy) => policy.targetRegion === '전국' || company.location.includes(policy.targetRegion),
  )

  // 구/군 단위로 좁게 특화된 정책 → 부산 전역 정책 → 전국 정책 순으로 우선 노출
  matched.sort((a, b) => specificity(b.targetRegion) - specificity(a.targetRegion))

  return matched.slice(0, limit)
}

function specificity(targetRegion) {
  if (targetRegion === '전국') return 0
  return targetRegion.split(' ').length // '부산' → 1, '부산 사상구' → 2
}

export function isPolicyExpired(policy) {
  if (!policy.deadline) return false
  return new Date(policy.deadline) < new Date()
}
