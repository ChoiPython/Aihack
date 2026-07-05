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

// 사용자가 선택한 우선순위 기준에 따른 가중치 (합 = 1).
// BEPA 실데이터의 companies.category(급여/워라밸/복지/미래 중 하나, 이 기업이 어느 부문
// 인증을 받았는지)와 이름을 맞춰서, 우선순위 선택이 실제 데이터 축과 바로 대응되게 했다.
// "미래"는 별도 성장성 지표가 없어 training_score(교육투자)를 대리 지표로 쓴다.
export const PRIORITY_WEIGHTS = {
  급여: { salary: 0.45, workLifeBalance: 0.1, welfare: 0.1, growth: 0.1, match: 0.25 },
  워라밸: { salary: 0.1, workLifeBalance: 0.45, welfare: 0.1, growth: 0.1, match: 0.25 },
  복지: { salary: 0.1, workLifeBalance: 0.1, welfare: 0.45, growth: 0.1, match: 0.25 },
  미래: { salary: 0.1, workLifeBalance: 0.1, welfare: 0.1, growth: 0.45, match: 0.25 },
}

// 실데이터 관측 범위(2026-07-05 기준) 안에서 0~100으로 정규화한다.
const RANGES = {
  avgAnnualSalary: [25980, 266080],
  worklifeBalanceScore: [2, 9],
  welfareScore: [2, 12],
  trainingScore: [0, 5],
}

function normalizeInRange(value, [min, max]) {
  if (value == null || Number.isNaN(value)) return 50
  if (max === min) return 50
  return clampScore(((value - min) / (max - min)) * 100)
}

export function normalizeSalary(value) {
  return normalizeInRange(value, RANGES.avgAnnualSalary)
}

export function normalizeWorkLifeBalance(value) {
  return normalizeInRange(value, RANGES.worklifeBalanceScore)
}

export function normalizeWelfare(value) {
  return normalizeInRange(value, RANGES.welfareScore)
}

export function normalizeGrowth(value) {
  return normalizeInRange(value, RANGES.trainingScore)
}
