import { useState } from 'react'
import { formatPercentage, scoreToBadgeColor, scoreToBarColor, scoreToLabel } from '../utils/scoreFormatter'
import { isPolicyExpired } from '../services/policyMatcher'

function formatWon(value) {
  if (value == null) return '정보 없음'
  return `${value.toLocaleString()}만원`
}

export default function RecommendationCard({ company, rank }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex animate-slide-up flex-col rounded-2xl border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100/40 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-white">
            {rank}
          </span>
          <div>
            <h3 className="text-base font-bold text-brand-navy sm:text-lg">{company.name}</h3>
            <p className="text-xs text-slate-500 sm:text-sm">
              {company.industry} · {company.region} · {company.company_size}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${scoreToBadgeColor(company.matchScore)}`}>
          {scoreToLabel(company.matchScore)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {company.category && (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-brand-primary">
            BEPA {company.category} 인증
          </span>
        )}
        {company.products_services && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {company.products_services}
          </span>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>적합도</span>
          <span className="text-brand-navy">{formatPercentage(company.matchScore)}</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${scoreToBarColor(company.matchScore)}`}
            style={{ width: formatPercentage(company.matchScore) }}
          />
        </div>
      </div>

      {company.matchingKeywords?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {company.matchingKeywords.slice(0, 5).map((keyword) => (
            <span
              key={keyword}
              className="rounded-full border border-brand-primary/30 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-brand-primary"
            >
              #{keyword}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-5 flex items-center justify-center gap-1.5 rounded-full border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-primary/40 hover:text-brand-primary sm:text-sm"
      >
        왜 추천됐나요?
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 rounded-xl bg-brand-bg/70 p-4 text-left animate-fade-in">
          <div>
            <p className="text-xs font-bold text-brand-navy">추천 근거</p>
            <ul className="mt-2 space-y-1.5">
              {company.reasons.map((reason) => (
                <li key={reason} className="flex gap-2 text-xs text-slate-600 sm:text-sm">
                  <span className="mt-0.5 text-brand-primary">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {company.policies?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-brand-navy">관련 청년 지원정책</p>
              <div className="mt-2 space-y-2">
                {company.policies.map((policy) => {
                  const expired = isPolicyExpired(policy)
                  return (
                    <div key={policy.id} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-brand-navy sm:text-sm">{policy.name}</p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            expired ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {expired ? '마감' : policy.deadline ? `~${policy.deadline}` : '상시 모집'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{policy.description}</p>
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        대상: 만 {policy.targetAgeMin}~{policy.targetAgeMax}세 · {policy.targetEmploymentStatus}
                      </p>
                      {expired ? (
                        <button
                          type="button"
                          disabled
                          className="mt-2 w-full cursor-not-allowed rounded-full bg-slate-100 py-2 text-xs font-semibold text-slate-400"
                        >
                          신청 마감
                        </button>
                      ) : (
                        <a
                          href={policy.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center justify-center rounded-full bg-brand-primary py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                          신청하기
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <DetailBlock title={`워라밸 (${company.worklife_balance_score ?? '-'}점)`} detail={company.worklife_balance_detail} />
            <DetailBlock title={`복지 (${company.welfare_score ?? '-'}점)`} detail={company.welfare_detail} />
            <DetailBlock title={`교육 (${company.training_score ?? '-'}점)`} detail={company.training_detail} />
          </div>

          {company.certifications && (
            <div>
              <p className="text-xs font-bold text-brand-navy">인증 현황</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{company.certifications}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-brand-navy">급여 및 재무 정보</p>
            <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 sm:text-sm">
              <span>평균 초임: {formatWon(company.avg_starting_salary)}</span>
              <span>평균 연봉: {formatWon(company.avg_annual_salary)}</span>
              <span>매출: {formatWon(company.revenue)}</span>
              <span>
                종업원 수: {company.employee_total ?? '정보 없음'}
                {company.employee_total != null && '명'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailBlock({ title, detail }) {
  if (!detail) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-semibold text-brand-primary">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{detail}</p>
    </div>
  )
}
