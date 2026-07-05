import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import HeroSection from '../components/HeroSection'
import UserProfileForm, { INITIAL_PROFILE } from '../components/UserProfileForm'
import RecommendationResults from '../components/RecommendationResults'
import { getRecommendations } from '../services/recommendationApi'

export default function HomePage() {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'done' | 'error'
  const [recommendations, setRecommendations] = useState([])
  const [burstNonce, setBurstNonce] = useState(0)
  const [lastProfile, setLastProfile] = useState(null)
  const resultsRef = useRef(null)
  const formRef = useRef(null)
  const location = useLocation()

  // scrollIntoView는 커밋 이후(effect)에 호출해야 안정적으로 동작한다.
  // 클릭 핸들러 안에서 동기 호출하면 뒤이은 React 리렌더 커밋과 경합해 스크롤이 무시될 수 있다.
  useEffect(() => {
    if (status === 'loading') {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [status])

  // 헤더에서 "/#profile-form" 같은 해시 링크로 들어왔을 때 해당 섹션으로 스크롤한다.
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1)
      const raf = requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      return () => cancelAnimationFrame(raf)
    }
    window.scrollTo({ top: 0 })
  }, [location])

  async function handleProfileSubmit(profile) {
    setStatus('loading')
    setLastProfile(profile)
    try {
      const results = await getRecommendations(profile)
      setRecommendations(results)
      setStatus('done')
      setBurstNonce((n) => n + 1)
    } catch (error) {
      console.error('추천 결과를 불러오지 못했습니다.', error)
      setStatus('error')
    }
  }

  function handleRetry() {
    if (lastProfile) handleProfileSubmit(lastProfile)
  }

  // 히어로의 간단 검색바에서 입력한 값을 상세 폼에도 반영하고, 바로 추천을 실행한다.
  function handleQuickSearch(partial) {
    const cleaned = Object.fromEntries(
      Object.entries(partial).filter(([, value]) => value !== '' && value !== undefined),
    )
    formRef.current?.applyQuickValues(cleaned)
    handleProfileSubmit({ ...INITIAL_PROFILE, ...cleaned })
  }

  return (
    <>
      <HeroSection onQuickSearch={handleQuickSearch} isLoading={status === 'loading'} />
      <UserProfileForm ref={formRef} onSubmit={handleProfileSubmit} isLoading={status === 'loading'} />
      <RecommendationResults
        ref={resultsRef}
        status={status}
        recommendations={recommendations}
        burstNonce={burstNonce}
        onRetry={handleRetry}
      />
    </>
  )
}
