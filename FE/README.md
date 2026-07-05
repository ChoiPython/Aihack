# 잡아드림 (Job-a-Dream)

IT 직무 기술 교육 해커톤 — 부산 청년 구직자를 위한 RAG 기반 기업 매칭 서비스 데모.

BEPA 청끌기업 데이터를 기반으로 사용자의 관심 직무·지역·역량·선호 복지와 기업 정보를
비교해 "왜 이 기업이 적합한지" 근거와 함께 추천합니다.

## 실행 방법

```bash
npm install
npm run dev
```

## 폴더 구조

```
src/
  components/   화면을 구성하는 컴포넌트 (Header, HeroSection, PipelineSection,
                UserProfileForm, RecommendationCard, RecommendationResults,
                RagExplainSection, TechStackSection)
  data/         해커톤 데모용 mock 기업 데이터 (mockCompanies.js)
  services/     추천 로직 mock API (recommendationApi.js) — 추후 실제 백엔드
                REST API 호출로 교체 가능하도록 분리
  utils/        점수 포맷팅 유틸 (scoreFormatter.js)
  App.jsx       전체 화면 조립 및 상태 관리
```

## 핵심 흐름

1. **기업 DB 구축** — 기업 소개·직무·복지·재무건전성 텍스트를 chunk로 분할, embedding 생성 후 vector DB(Chroma/FAISS) 저장 (데모에서는 `mockCompanies.js`로 대체)
2. **사용자 질의** — 관심 산업/직무/기술 스택/지역/복지/우선순위 입력
3. **벡터 검색(Retrieval)** — 사용자 입력과 기업 데이터를 비교해 유사도가 높은 Top-K 검색
4. **AI 추천 생성(Generation)** — 적합도, 추천 이유, 근거 문서, 지원 전략을 자연어로 제시

## 기술 스택

- Frontend: React + Vite, Tailwind CSS
- AI Pipeline(예정): Python, LangChain
- Vector DB(예정): Chroma / FAISS
- LLM API(예정): OpenAI API / Claude API
