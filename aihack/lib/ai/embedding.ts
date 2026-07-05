// lib/ai/embedding.ts
//
// 텍스트 → 벡터 변환 (Gemini Embedding API)
// PRD 9.2 체크리스트 1번, PRD 14.1/14.3 참고
//
// Gemini Embedding은 용도(taskType)를 구분해서 넣어야 검색 품질이 좋아짐:
//   - 기업 데이터를 저장할 때        → RETRIEVAL_DOCUMENT
//   - 사용자가 검색어를 입력했을 때   → RETRIEVAL_QUERY
// (Voyage AI의 input_type=document/query 구분과 동일한 개념)

import { genAI, EMBEDDING_MODEL } from './gemini-client'
import type { Company } from './types'

/**
 * 기업 문서 하나를 벡터로 변환 (인덱싱 시점에 사용)
 * 임베딩 대상 텍스트는 buildCompanyDocument()로 조합한다.
 */
export async function embedDocument(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL })

  const result = await model.embedContent({
    content: { role: 'user', parts: [{ text }] },
    taskType: 'RETRIEVAL_DOCUMENT' as never, // SDK 타입 정의 버전에 따라 캐스팅 필요할 수 있음
  })

  return result.embedding.values
}

/**
 * 사용자 검색어를 벡터로 변환 (검색 시점에 사용)
 */
export async function embedQuery(query: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL })

  const result = await model.embedContent({
    content: { role: 'user', parts: [{ text: query }] },
    taskType: 'RETRIEVAL_QUERY' as never,
  })

  return result.embedding.values
}

/**
 * 여러 기업 문서를 한 번에 벡터로 변환 (인덱싱 스크립트에서 배치 처리용)
 * 무료 티어 요청 빈도 제한을 고려해 순차 처리 + 약간의 딜레이를 둠.
 */
export async function embedDocumentsBatch(
  texts: string[],
  delayMs = 200
): Promise<number[][]> {
  const vectors: number[][] = []

  for (const text of texts) {
    const vector = await embedDocument(text)
    vectors.push(vector)
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return vectors
}

/**
 * 임베딩 대상 텍스트 조합 규칙.
 * DB에 별도 컬럼으로 저장하지 않고, 인덱싱 시점에 매번 조합해서 사용.
 * companies 테이블 실제 컬럼(lib/db/schema.sql) 기준으로 조합하며,
 * 값이 없는 필드는 문장에서 생략한다.
 */
export function buildCompanyDocument(company: Company): string {
  const parts: string[] = [
    `${company.name}은(는) ${company.region ?? '지역 미상'}에 위치한 ${
      company.industry ?? company.category ?? '업종 미상'
    } 기업입니다.`,
  ]

  if (company.company_size) parts.push(`기업 규모: ${company.company_size}.`)
  if (company.avg_starting_salary != null) parts.push(`초임 평균 연봉: ${company.avg_starting_salary}만원.`)
  if (company.avg_annual_salary != null) parts.push(`평균 연봉: ${company.avg_annual_salary}만원.`)
  if (company.worklife_balance_detail) parts.push(`워라밸: ${company.worklife_balance_detail}.`)
  if (company.training_detail) parts.push(`교육/훈련: ${company.training_detail}.`)
  if (company.welfare_detail) parts.push(`복지: ${company.welfare_detail}.`)
  if (company.products_services) parts.push(`주요 제품/서비스: ${company.products_services}.`)
  if (company.certifications) parts.push(`인증: ${company.certifications}.`)

  return parts.join(' ')
}
