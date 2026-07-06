# 🎯 잡아드림 (Job-a-Dream)

**IT 직무 기술 교육 해커톤 (2026.07) — 부산 청년 구직자를 위한 RAG 기반 기업·정책 매칭 서비스**

<br>

<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black">
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
<img src="https://img.shields.io/badge/Gemini_API-embedding%2Fgeneration-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white">
<img src="https://img.shields.io/badge/ChromaDB-vector_search-orange?style=for-the-badge">
<img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">

> 5인 팀(전공 3 · 비전공 2) · 09:00~15:00 원데이 해커톤 · 발표 5분

---

## 📌 문제 정의

취업 준비생은 기업 정보와 청년 지원정책이 파편화되어 있어 여러 사이트를 오가며 정보를 찾아야 하고, 기존 채용 플랫폼은 키워드 매칭 수준이라 **"왜 이 기업이 나에게 맞는지"**에 대한 근거를 주지 못합니다.

**잡아드림**은 부산 BEPA(부산경제진흥원) **"청끌기업" 실데이터**와 청년 지원정책 데이터를 기반으로, 사용자의 자연어 질의를 벡터 검색으로 매칭하고 Gemini가 추천 근거를 함께 생성해주는 서비스입니다.

## 🧠 RAG 파이프라인

```
[기업 실데이터 CSV] ──▶ PostgreSQL(Neon) 적재  (구조화 데이터: 연봉/복지/지역 등)
                    └─▶ Gemini Embedding(gemini-embedding-001) ──▶ ChromaDB 저장 (벡터)

[사용자 자연어 질의] ──▶ Gemini Embedding(query) ──▶ ChromaDB 유사도 검색 (Top-5, 임계값 0.5)
                                                    └─▶ Gemini(gemini-2.5-flash)가
                                                        검색 결과 전체를 배치로 받아
                                                        "왜 적합한지" 추천 이유 생성
```

- **검색(Retrieval)과 생성(Generation)의 역할을 분리**: ChromaDB는 유사도로 후보만 찾고, 순서 재정렬/이유 생성은 전적으로 Gemini가 담당
- **비용 최적화**: 기업별로 API를 5번 나눠 호출하지 않고 Top-K 전체를 프롬프트 하나에 담아 배치 호출 (무료 티어 한도 고려), 검색 결과 없으면 Gemini 호출 자체를 생략
- **정책 매칭**: 기업 소재 지역(`region`) 기준으로 청년 지원정책을 함께 매칭

## 🏗️ 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React 19 + Vite, React Router |
| Backend | Vercel Serverless Functions (Node.js) |
| 구조화 데이터 | PostgreSQL (Neon), `pg` |
| 벡터 검색 | ChromaDB |
| AI (임베딩+생성) | Google Gemini API (`gemini-embedding-001`, `gemini-2.5-flash`) — 하나의 클라이언트로 통합 |
| 데이터 | BEPA 청끌기업 실데이터, 청년 지원정책 17개 |

## 🙋 본인 역할 — Backend / DB 리드

5인 중 전공자 3인이 각각 Backend/DB, AI/RAG, 풀스택 조율을 리드하는 구조로 역할을 나눴고, 그중 **Backend/DB 영역을 담당**했습니다.

- PostgreSQL 스키마 설계 (`companies`, `policies`, `recommendations_cache`)
- 시드 스크립트 작성 (`scripts/seed.js`, `scripts/migrate.js`) — 청끌기업 실데이터 CSV를 DB로 일괄 적재
- DB 클라이언트/쿼리 모듈 (`lib/db/client.js`, `lib/db/queries.js`)
- 청년 지원정책 조회 API (`api/policies/index.js`)
- 실데이터(`2026_청끌기업.csv`, `잡아드림_기업정책17개.csv`) 정리 및 통합

## 📂 폴더 구조

```
Aihack/
├── PRD.md              # 기능 명세·아키텍처 결정 근거 (역할 분담, DB 스키마, RAG 설계 원칙 포함)
├── CLAUDE.md            # Claude Code 작업 규칙
└── aihack/              # 실제 서비스 코드
    ├── src/             # React 프론트엔드
    ├── api/             # Vercel Serverless Functions
    ├── lib/ai/          # Gemini 임베딩·검색·생성 파이프라인
    ├── lib/db/          # PostgreSQL 스키마·쿼리
    ├── scripts/         # DB 마이그레이션/시드/인덱싱 스크립트
    └── data/             # 실데이터 CSV
```

## ▶️ 실행 방법

```bash
cd aihack
npm install
cp .env.local.example .env.local   # GEMINI_API_KEY, DATABASE_URL, CHROMA_URL 입력

npm run db:migrate   # PostgreSQL 스키마 생성
npm run db:seed      # 실데이터 적재
npm run dev
```

## 📝 참고

이 저장소는 팀 저장소([HoneyPlums/YaHo](https://github.com/HoneyPlums/YaHo))의 fork입니다. 상세 기능 명세와 설계 근거는 [`PRD.md`](PRD.md)에 정리되어 있습니다.
