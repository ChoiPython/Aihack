# 잡아드림 (Job-a-Dream)

IT 직무 기술 교육 해커톤 — 부산 청년 구직자를 위한 RAG 기반 기업 매칭 서비스.

BEPA 청끌기업 실데이터를 기반으로 사용자의 관심 직무·지역·역량·선호 복지와 기업 정보를
비교해 "왜 이 기업이 적합한지" 근거와 함께 추천합니다.

## 실행 방법

```bash
npm install
cp .env.local.example .env.local   # GEMINI_API_KEY, DATABASE_URL, CHROMA_URL 입력

npm run db:migrate
npm run db:seed
npm run dev
```

## 폴더 구조

```
src/
  components/   화면을 구성하는 컴포넌트 (Header, HeroSection, PipelineSection,
                UserProfileForm, RecommendationCard, RecommendationResults,
                RagExplainSection, TechStackSection)
  data/         실데이터 fallback / 예시 데이터
  services/     추천 API 연동
  utils/        점수 포맷팅 유틸 (scoreFormatter.js)
  App.jsx       전체 화면 조립 및 상태 관리

api/            Vercel Serverless Functions (기업/정책 조회, 추천)
lib/ai/         Gemini 임베딩·검색(ChromaDB)·생성 파이프라인
lib/db/         PostgreSQL 스키마 및 쿼리
scripts/        DB 마이그레이션 / 시드 / 인덱싱 스크립트
data/           청끌기업 실데이터, 청년 지원정책 CSV
```

## 핵심 흐름

1. **기업 DB 구축** — 기업 소개·직무·복지·재무건전성 텍스트를 조합(`buildCompanyDocument`)해 Gemini Embedding으로 벡터화 후 ChromaDB에 저장, 원본 데이터는 PostgreSQL에 함께 적재
2. **사용자 질의** — 관심 산업/직무/기술 스택/지역/복지/우선순위 입력
3. **벡터 검색(Retrieval)** — 질의를 Gemini Embedding으로 벡터화 후 ChromaDB에서 Top-5, 유사도 임계값 0.5 기준 검색
4. **AI 추천 생성(Generation)** — 검색된 기업 전체를 배치로 Gemini(`gemini-2.5-flash`)에 전달해 적합도 근거를 한 번에 생성 (기업별 개별 호출 없음)

## 기술 스택

- Frontend: React + Vite
- Backend: Vercel Serverless Functions
- Database: PostgreSQL (Neon)
- Vector Database: ChromaDB
- LLM/Embedding: Google Gemini API (`gemini-embedding-001`, `gemini-2.5-flash`)
