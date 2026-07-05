import { useState } from 'react'
import floatingPerson2Img from '../assets/floating-person-2.png'
import floatingPerson3Img from '../assets/floating-person-3.png'

const POPULAR_KEYWORDS = [
  { label: '#신입환영', partial: { jobRole: '신입 개발자' } },
  { label: '#IT', partial: { industry: 'IT·데이터' } },
  { label: '#핀테크', partial: { industry: '핀테크' } },
  { label: '#부산', partial: { location: '부산 전체' } },
  { label: '#워라밸', partial: { priority: '워라밸' } },
  { label: '#복지좋은기업', partial: { benefits: ['재택 근무 병행', '자율 출퇴근'] } },
]

export default function HeroSection({ onQuickSearch, isLoading }) {
  const [quick, setQuick] = useState({ industry: '', jobRole: '', location: '' })

  function updateQuick(field, value) {
    setQuick((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onQuickSearch(quick)
  }

  function handleKeywordClick(keyword) {
    const nextQuick = { ...quick, ...keyword.partial }
    setQuick({
      industry: nextQuick.industry ?? quick.industry,
      jobRole: nextQuick.jobRole ?? quick.jobRole,
      location: nextQuick.location ?? quick.location,
    })
    onQuickSearch({ ...quick, ...keyword.partial })
  }

  return (
    <section id="top" className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-20 h-80 w-80 rounded-full bg-brand-primary/20 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-5 py-20 md:py-28">
        {/* 상단: 중앙 정렬 카피 */}
        <div className="mx-auto flex animate-slide-up flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-brand-primary shadow-sm">
            청년의 성장, 기업의 내일을{' '}
            <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
              연결합니다
            </span>
          </span>

          <div className="relative">
            <h1 className="mt-5 text-3xl font-bold leading-tight text-brand-navy sm:text-4xl md:text-5xl">
              나에게 딱 맞는
              <br />
              <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                기업을 추천받아보세요
              </span>
            </h1>

            {/* 둥둥 떠 있는 캐릭터 두 명: 제목 11시/1시 방향 */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-10 hidden w-32 sm:block lg:w-40"
              style={{ left: '-170px' }}
            >
              <img src={floatingPerson3Img} alt="" className="w-full animate-float" />
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 hidden w-32 sm:block lg:w-40"
              style={{ left: 'calc(100% + 30px)' }}
            >
              <img src={floatingPerson2Img} alt="" className="w-full animate-float" style={{ animationDelay: '1.1s' }} />
            </div>
          </div>

          <p className="mt-5 max-w-xl text-base text-slate-600 md:text-lg">
            AI가 당신의 관심사와 역량을 분석해 최적의 기업을 찾아드려요.
          </p>

          <div className="mt-9">
            <a
              href="#quick-search"
              className="rounded-full bg-brand-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:scale-105 hover:bg-blue-700"
            >
              내 기업 추천받기
            </a>
          </div>
        </div>

        {/* 하단: 가로로 긴 퀵서치 바 */}
        <form
          id="quick-search"
          onSubmit={handleSubmit}
          className="mt-12 animate-slide-up scroll-mt-24 rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-lg shadow-blue-100/60 backdrop-blur-sm sm:p-5"
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <QuickField label="관심 분야">
              <input
                type="text"
                value={quick.industry}
                onChange={(event) => updateQuick('industry', event.target.value)}
                placeholder="예) 핀테크, IT, 바이오"
                className="quick-input"
              />
            </QuickField>
            <QuickField label="희망 직무">
              <input
                type="text"
                value={quick.jobRole}
                onChange={(event) => updateQuick('jobRole', event.target.value)}
                placeholder="예) 개발, 마케팅, 기획"
                className="quick-input"
              />
            </QuickField>
            <QuickField label="지역">
              <div className="relative">
                <input
                  type="text"
                  value={quick.location}
                  onChange={(event) => updateQuick('location', event.target.value)}
                  placeholder="예) 부산, 서울, 대구"
                  className="quick-input pr-8"
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </div>
            </QuickField>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-primary px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-transform hover:scale-[1.02] hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 lg:h-[46px]"
            >
              <span aria-hidden>✨</span>
              {isLoading ? '검색 중…' : 'AI 추천받기'}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5">
            <span className="text-xs font-medium text-slate-400">인기 키워드</span>
            {POPULAR_KEYWORDS.map((keyword) => (
              <button
                key={keyword.label}
                type="button"
                onClick={() => handleKeywordClick(keyword)}
                className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-brand-primary transition-colors hover:bg-brand-primary hover:text-white"
              >
                {keyword.label}
              </button>
            ))}
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500 sm:text-sm">
          500+ BEPA 청끌기업 · Top 5 맞춤 추천 · 근거 기반 AI 설명
        </p>
      </div>
    </section>
  )
}

function QuickField({ label, children }) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  )
}
