// lib/ai/types.ts
//
// lib/db/schema.sql의 companies 테이블 컬럼과 1:1로 맞춘 타입.
// 스키마가 바뀌면 이 타입도 함께 갱신할 것.

export interface Company {
  id: string // ChromaDB 문서 ID와 동일하게 사용
  name: string
  category: string | null
  industry: string | null
  company_size: string | null
  avg_starting_salary: number | null
  avg_annual_salary: number | null
  revenue: number | null
  employee_total: number | null
  employee_regular: number | null
  employee_nonregular: number | null
  worklife_balance_score: number | null
  worklife_balance_detail: string | null
  training_score: number | null
  training_detail: string | null
  welfare_score: number | null
  welfare_detail: string | null
  region: string | null
  products_services: string | null
  certifications: string | null
  created_at: string
}

export interface SearchResultItem {
  company: Company
  similarity: number // 코사인 유사도, 0~1
}

export interface RecommendationItem {
  companyId: string
  reason: string // Gemini가 생성한 추천 이유
}
