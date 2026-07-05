import { forwardRef } from 'react'
import { SectionHeading } from './SectionHeading'
import RecommendationCard from './RecommendationCard'
import EmojiBurst from './EmojiBurst'

const RecommendationResults = forwardRef(function RecommendationResults(
  { status, recommendations, burstNonce, onRetry },
  ref,
) {
  return (
    <section ref={ref} id="recommendation-results" className="relative bg-brand-bg px-5 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="relative">
          <SectionHeading
            eyebrow="AI 추천 결과"
            title="회원님을 위한 맞춤 기업 Top 5"
            description="벡터 검색으로 찾은 유사 기업을 LLM이 비교 분석해 추천 이유까지 설명해드려요."
          />
          {status === 'done' && recommendations.length > 0 && <EmojiBurst key={burstNonce} />}
        </div>

        <div className="mt-12">
          {status === 'idle' && <EmptyState />}
          {status === 'loading' && <LoadingState />}
          {status === 'error' && <ErrorState onRetry={onRetry} />}
          {status === 'done' && recommendations.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((company, index) => (
                <RecommendationCard key={company.id} company={company} rank={index + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
})

export default RecommendationResults

function EmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-dashed border-blue-200 bg-white/60 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">🔍</div>
      <p className="mt-4 text-sm font-semibold text-brand-navy sm:text-base">
        조건을 입력하면 추천 결과가 표시됩니다.
      </p>
      <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
        위 사용자 질의 폼을 채우고 "내 기업 추천받기"를 눌러보세요.
      </p>
    </div>
  )
}

function ErrorState({ onRetry }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-dashed border-rose-200 bg-rose-50/40 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-2xl">⚠️</div>
      <p className="mt-4 text-sm font-semibold text-brand-navy sm:text-base">
        일시적으로 추천을 불러오지 못했어요.
      </p>
      <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">잠시 후 다시 시도해주세요.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-full bg-brand-primary px-6 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 sm:text-sm"
      >
        다시 시도
      </button>
    </div>
  )
}

function LoadingState() {
  return (
    <div>
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
          <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-brand-primary border-t-transparent" />
        </div>
        <p className="mt-3 text-sm font-semibold text-brand-navy sm:text-base">
          기업 데이터를 검색하고 있어요…
        </p>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          벡터 DB에서 유사 기업을 찾고, AI가 추천 이유를 생성하는 중이에요.
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-blue-100 bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-4 flex gap-1.5">
        <div className="h-5 w-16 rounded-full bg-slate-100" />
        <div className="h-5 w-20 rounded-full bg-slate-100" />
      </div>
      <div className="mt-5 h-2 w-full rounded-full bg-slate-100" />
      <div className="mt-5 h-9 w-full rounded-full bg-slate-100" />
    </div>
  )
}
