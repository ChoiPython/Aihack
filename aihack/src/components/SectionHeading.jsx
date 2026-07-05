export function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && <span className="text-xs font-bold uppercase tracking-wide text-brand-primary">{eyebrow}</span>}
      <h2 className="mt-2 text-2xl font-bold text-brand-navy sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 text-sm text-slate-600 sm:text-base">{description}</p>}
    </div>
  )
}
