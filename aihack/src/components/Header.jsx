import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const NAV_LINKS = [
  { label: '홈', to: '/', isPage: true },
  { label: '추천받기', to: '/#profile-form' },
  { label: '기업 탐색', to: '/#recommendation-results' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-lg font-bold text-white shadow-sm">
            잡
          </span>
          <span className="text-lg font-bold text-brand-navy">잡아드림</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) =>
            link.isPage ? (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-brand-primary ${
                    isActive ? 'text-brand-primary' : 'text-slate-600'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ) : (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-primary"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/#recommendation-results"
            className="rounded-full bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-transform hover:scale-105 hover:bg-blue-700"
          >
            기업탐색 바로가기
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 md:hidden"
          aria-label="메뉴 열기"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-slate-100 bg-white px-5 py-3 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-brand-primary"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/#recommendation-results"
            onClick={() => setMenuOpen(false)}
            className="mt-2 rounded-full bg-brand-primary px-4 py-2.5 text-center text-sm font-semibold text-white"
          >
            기업탐색 바로가기
          </Link>
        </nav>
      )}
    </header>
  )
}
