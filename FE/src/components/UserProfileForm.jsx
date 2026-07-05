import { forwardRef, useImperativeHandle, useState } from 'react'
import { SectionHeading } from './SectionHeading'

// BEPA 청끌기업 실데이터(FE/data/2026_청끌기업.csv) 기준 산업/지역 목록.
// 통계청 표준산업분류 대분류 중 실제 데이터에 존재하는 것만, 지역은 부산 16개 구/군.
export const INDUSTRY_OPTIONS = [
  '건설업',
  '과학 및 기술서비스업',
  '교육서비스업',
  '금융 및 보험업',
  '도매 및 소매업',
  '보건업 및 사회복지 서비스업',
  '사업시설관리 및 사업지원 서비스업',
  '숙박 및 음식점업',
  '운수 및 창고업',
  '정보통신업',
  '제조업',
]

export const LOCATION_OPTIONS = [
  '부산 전체',
  '강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구',
  '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구',
]

// 기업의 worklife_balance_detail/welfare_detail/training_detail 텍스트에서
// 부분 문자열로 찾을 수 있는 대표 항목들 (실데이터 상세 텍스트 기준으로 추림).
const BENEFIT_OPTIONS = [
  '재택근무',
  '육아휴직',
  '4대보험',
  '퇴직연금',
  '자기계발비 지원',
  '유연근무제',
  '학자금 지원',
  '해외연수',
]

// companies.category(급여/워라밸/복지/미래)와 이름을 맞춘 우선순위 기준
const PRIORITY_OPTIONS = ['급여', '워라밸', '복지', '미래']

export const INITIAL_PROFILE = {
  industry: INDUSTRY_OPTIONS[0],
  location: LOCATION_OPTIONS[0],
  benefits: [],
  priority: '워라밸',
  freeText: '',
}

const UserProfileForm = forwardRef(function UserProfileForm({ onSubmit, isLoading }, ref) {
  const [profile, setProfile] = useState(INITIAL_PROFILE)

  useImperativeHandle(ref, () => ({
    applyQuickValues(partial) {
      setProfile((prev) => ({ ...prev, ...partial }))
    },
  }))

  function updateField(field, value) {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  function toggleBenefit(benefit) {
    setProfile((prev) => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter((item) => item !== benefit)
        : [...prev.benefits, benefit],
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(profile)
  }

  function fillDemoExample() {
    setProfile({
      industry: '정보통신업',
      location: '해운대구',
      benefits: ['재택근무', '자기계발비 지원'],
      priority: '워라밸',
      freeText: '워라밸 좋은 IT 기업을 찾고 있어요. 재택근무도 가능하면 좋겠어요.',
    })
  }

  return (
    <section id="profile-form" className="bg-white px-5 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="사용자 질의"
          title="나에게 맞는 기업, 조건을 입력해주세요"
          description="입력하신 정보로 BEPA 청년친화강소기업 데이터베이스에서 유사한 기업을 검색해요."
        />

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-7 rounded-3xl border border-blue-100 bg-brand-bg/60 p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="관심 산업">
              <select
                value={profile.industry}
                onChange={(event) => updateField('industry', event.target.value)}
                className="form-input"
              >
                {INDUSTRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="근무 희망 지역">
              <select
                value={profile.location}
                onChange={(event) => updateField('location', event.target.value)}
                className="form-input"
              >
                {LOCATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="선호 복지 (복수 선택 가능)">
            <div className="flex flex-wrap gap-2">
              {BENEFIT_OPTIONS.map((benefit) => {
                const active = profile.benefits.includes(benefit)
                return (
                  <button
                    type="button"
                    key={benefit}
                    onClick={() => toggleBenefit(benefit)}
                    className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-colors sm:text-sm ${
                      active
                        ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-brand-primary/50 hover:text-brand-primary'
                    }`}
                  >
                    {benefit}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="중요하게 보는 기준">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRIORITY_OPTIONS.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                    profile.priority === option
                      ? 'border-brand-primary bg-blue-50 text-brand-primary'
                      : 'border-slate-200 text-slate-500 hover:border-brand-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={option}
                    checked={profile.priority === option}
                    onChange={(event) => updateField('priority', event.target.value)}
                    className="sr-only"
                  />
                  {option}
                </label>
              ))}
            </div>
          </Field>

          <Field label="자유 입력란 (선택)">
            <textarea
              value={profile.freeText}
              onChange={(event) => updateField('freeText', event.target.value)}
              placeholder="예: 워라밸 좋은 IT 기업을 찾고 있어요."
              rows={3}
              className="form-input resize-none"
            />
          </Field>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={fillDemoExample}
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-brand-primary/40 hover:text-brand-primary"
            >
              데모 예시 채우기
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-brand-primary px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:scale-105 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {isLoading ? '검색 중…' : '내 기업 추천받기'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
})

export default UserProfileForm

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-brand-navy">{label}</span>
      {children}
    </label>
  )
}
