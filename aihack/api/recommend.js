import { generateRecommendationReasons } from '../lib/ai/generate'

// POST /api/recommend
// body: { userProfile, companies }
//   - userProfile: 사용자 프로필/검색 조건 객체
//   - companies:   이미 Top-K로 좁혀진 기업 후보 목록 (검색/Retrieval 단계 결과)
//
// 브라우저에서 직접 Gemini를 호출하던 방식(src/services/geminiClient.js)을
// 서버로 옮겨서 GEMINI_API_KEY가 클라이언트 번들에 노출되지 않게 한다.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { userProfile, companies } = req.body ?? {}

  if (!userProfile || !Array.isArray(companies) || companies.length === 0) {
    res.status(400).json({ error: 'userProfile과 companies 배열이 필요합니다' })
    return
  }

  try {
    const queryText = buildQueryText(userProfile)
    const results = companies.map((company) => ({ company, similarity: 1 }))

    const recommendations = await generateRecommendationReasons(queryText, results)

    // 클라이언트(recommendationApi.js)가 기대하는 기존 계약({ id, reasons: string[] })에 맞춰 변환
    const response = recommendations.map((r) => ({
      id: r.companyId,
      reasons: r.reason ? [r.reason] : [],
    }))

    res.status(200).json(response)
  } catch (err) {
    console.error('POST /api/recommend failed', err)
    res.status(500).json({ error: '추천 이유 생성에 실패했습니다' })
  }
}

function buildQueryText(userProfile) {
  return [
    `관심 산업: ${userProfile.industry || '미지정'}`,
    `희망 직무: ${userProfile.jobRole || '미지정'}`,
    `보유 기술: ${userProfile.skills || '미지정'}`,
    `근무 희망 지역: ${userProfile.location || '미지정'}`,
    `선호 복지: ${(userProfile.benefits || []).join(', ') || '미지정'}`,
    `중요하게 보는 기준: ${userProfile.priority || '미지정'}`,
    `자유 입력: ${userProfile.freeText || '(없음)'}`,
  ].join('\n')
}
