// Gemini API를 프론트엔드에서 직접 호출해 Top-K 후보 기업에 대한 추천 이유를 배치 생성한다.
// 해커톤 데모용 임시 구조 — 백엔드가 생기면 이 호출은 서버로 옮겨서 API 키를 감춰야 한다.

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

function buildPrompt(userProfile, companies) {
  const profileText = [
    `관심 산업: ${userProfile.industry || '미지정'}`,
    `근무 희망 지역: ${userProfile.location || '미지정'}`,
    `선호 복지: ${(userProfile.benefits || []).join(', ') || '미지정'}`,
    `중요하게 보는 기준: ${userProfile.priority || '미지정'}`,
    `자유 입력: ${userProfile.freeText || '(없음)'}`,
  ].join('\n')

  const companiesText = companies
    .map((c) =>
      [
        `id: ${c.id}`,
        `이름: ${c.name}`,
        `산업: ${c.industry}`,
        `지역: ${c.region}`,
        `기업 규모: ${c.company_size}`,
        `BEPA 인증 부문: ${c.category}`,
        `평균 초임/평균 연봉: ${c.avg_starting_salary}만원 / ${c.avg_annual_salary}만원`,
        `워라밸 점수(${c.worklife_balance_score}점): ${c.worklife_balance_detail}`,
        `복지 점수(${c.welfare_score}점): ${c.welfare_detail}`,
        `교육 점수(${c.training_score}점): ${c.training_detail}`,
        `주요 사업/제품: ${c.products_services}`,
        `인증 현황: ${c.certifications}`,
      ].join('\n'),
    )
    .join('\n\n')

  return `당신은 취업 준비생에게 기업을 추천하는 AI입니다. 아래 지원자 프로필과 후보 기업 목록을 보고, 각 기업이 왜 이 지원자에게 적합한지 한국어로 구체적인 이유를 2~3개씩 생성하세요. 지원자 프로필에 없는 사실을 지어내지 마세요.

[지원자 프로필]
${profileText}

[후보 기업 목록]
${companiesText}

아래 JSON 배열 형식으로만 응답하세요 (다른 설명 텍스트 없이):
[{ "id": "기업id", "reasons": ["이유1", "이유2"] }, ...]`
}

function extractJson(text) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim()
  return JSON.parse(cleaned)
}

/**
 * Top-K 후보 기업에 대해 Gemini로 추천 이유를 배치 생성한다.
 * 반환값: [{ id, reasons: string[] }, ...]
 */
export async function generateRecommendationReasons(userProfile, companies) {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY가 설정되지 않았습니다.')
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(userProfile, companies) }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API 오류 (${response.status}): ${errText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini 응답에서 텍스트를 찾을 수 없습니다.')

  return extractJson(text)
}
