import { searchCompanies } from '../../lib/ai/search.js'
import { getCompaniesByIds, searchCompaniesFallback } from '../../lib/db/queries.js'
import type { SearchResultItem } from '../../lib/ai/types.js'

// GET /api/companies?q=자연어질의
//
// 1. lib/ai/search.ts로 질의를 임베딩하고 ChromaDB에서 Top-K 기업 id를 찾음
// 2. lib/db/queries.js의 getCompaniesByIds로 PostgreSQL에서 상세 정보를 조회
// 3. 벡터 검색의 유사도 순서를 유지한 채 상세 정보와 합쳐서 응답
//
// ChromaDB에 아직 데이터가 없거나 벡터 검색이 실패하면(색인 전 등),
// 기존 키워드 기반 searchCompaniesFallback으로 자동 폴백한다.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (!q) {
    res.status(400).json({ error: 'query parameter "q"가 필요합니다' })
    return
  }

  try {
    const companies = await searchWithVectorFallback(q)
    res.status(200).json({ companies })
  } catch (err) {
    console.error('GET /api/companies failed', err)
    res.status(500).json({ error: '기업 검색에 실패했습니다' })
  }
}

async function searchWithVectorFallback(q: string) {
  let results: SearchResultItem[]

  try {
    results = await searchCompanies(q)
  } catch (err) {
    console.error('벡터 검색 실패, 키워드 검색으로 폴백합니다', err)
    return searchCompaniesFallback(q)
  }

  if (results.length === 0) {
    return searchCompaniesFallback(q)
  }

  const ids = results.map((r) => r.company.id)
  const rows = await getCompaniesByIds(ids)
  const rowsById = new Map(rows.map((row) => [row.id, row]))

  return results
    .map((r) => {
      const detail = rowsById.get(r.company.id)
      if (!detail) return null
      return { ...detail, similarity: r.similarity }
    })
    .filter((row) => row !== null)
}
