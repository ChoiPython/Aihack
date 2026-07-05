import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white px-5 py-10 text-center">
      <p className="text-sm font-bold text-brand-navy">잡아드림 (Job-a-Dream)</p>
      <p className="mt-1 text-xs text-slate-400">BEPA 청끌기업 데이터 기반 RAG 취업 매칭 서비스 · 해커톤 데모</p>
    </footer>
  )
}
