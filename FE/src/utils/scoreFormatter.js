// 적합도 점수(0~100)를 화면 표시용 값으로 변환하는 유틸

export function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function scoreToLabel(score) {
  if (score >= 90) return '매우 적합'
  if (score >= 75) return '적합'
  if (score >= 60) return '보통'
  return '참고용'
}

// Tailwind 클래스는 정적 문자열로 완성된 형태여야 JIT가 인식하므로 매핑 테이블로 관리
export const SCORE_BAR_COLOR = {
  high: 'bg-brand-primary',
  mid: 'bg-brand-accent',
  low: 'bg-slate-300',
}

export function scoreToBarColor(score) {
  if (score >= 75) return SCORE_BAR_COLOR.high
  if (score >= 60) return SCORE_BAR_COLOR.mid
  return SCORE_BAR_COLOR.low
}

export const SCORE_BADGE_COLOR = {
  high: 'bg-blue-50 text-brand-primary border border-blue-200',
  mid: 'bg-sky-50 text-sky-600 border border-sky-200',
  low: 'bg-slate-100 text-slate-500 border border-slate-200',
}

export function scoreToBadgeColor(score) {
  if (score >= 75) return SCORE_BADGE_COLOR.high
  if (score >= 60) return SCORE_BADGE_COLOR.mid
  return SCORE_BADGE_COLOR.low
}

export function formatPercentage(score) {
  return `${clampScore(score)}%`
}

// 사용자가 선택한 우선순위 기준에 따른 가중치 (합 = 1)
export const PRIORITY_WEIGHTS = {
  성장성: { growthPotential: 0.4, stability: 0.15, salaryLevel: 0.15, workLifeBalance: 0.15, match: 0.15 },
  안정성: { growthPotential: 0.15, stability: 0.4, salaryLevel: 0.15, workLifeBalance: 0.15, match: 0.15 },
  연봉: { growthPotential: 0.15, stability: 0.15, salaryLevel: 0.4, workLifeBalance: 0.15, match: 0.15 },
  워라밸: { growthPotential: 0.15, stability: 0.15, salaryLevel: 0.15, workLifeBalance: 0.4, match: 0.15 },
  직무적합성: { growthPotential: 0.1, stability: 0.1, salaryLevel: 0.1, workLifeBalance: 0.1, match: 0.6 },
}
