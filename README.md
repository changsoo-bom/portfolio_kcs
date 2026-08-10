# portfolio_kcs

포트폴리오 사이트.

## 스택

Next.js 16 (App Router · Turbopack · React Compiler) / React 19.2 / TypeScript strict / Tailwind CSS v4 / pnpm

Zustand · TanStack Query · Zod · Prisma는 아직 설치하지 않았다. 실제로 필요해진 시점에 추가한다.

## 실행

```bash
pnpm install
pnpm dev     # http://localhost:3000
pnpm build
pnpm lint
```

## 폴더 구조

```
src/
├── app/          # 라우팅 전용 — (public) / (auth) 라우트 그룹, actions.ts
├── components/   # ui(프리미티브) / common(공통 조합) / {도메인}/{기능}/
├── hooks/        # use-*.ts 클라이언트 훅
├── lib/          # 외부 API 클라이언트, schemas/, prisma.ts, 스토어
├── types/        # {domain}.ts
└── constants/
```

의존 방향: `types → schemas → lib → components → app`. 위 단계는 아래만 알고, 역방향은 없다.

폴더는 미리 만들지 않는다. 해당 코드가 실제로 생길 때 만든다.

## 코드 규칙

- TypeScript strict, **`any` 금지** (불가피하면 `unknown` + 타입 가드)
- 경로 별칭 `@/` 항상 사용, 상대 경로 `../` 금지
- Import 순서: 외부 라이브러리 → `@/*` → 상대 경로(CSS 등)
- **컴포넌트만 PascalCase, 나머지 파일·폴더는 전부 kebab-case**
- 기본은 서버 컴포넌트. `"use client"`는 실제로 상호작용하는 말단에만
- `forwardRef` 쓰지 않는다 — ref를 일반 prop으로 받는다 (React 19)
- `useEffect` 안에서 `setState` 금지 — 파생 값으로 계산하거나 `key`로 리마운트
- 읽기는 서버 컴포넌트, 쓰기는 Server Action. Route Handler를 새로 만들지 않는다
- 필터·정렬·페이지는 `searchParams`로 받는다
- Tailwind v4 — `tailwind.config.js` 없음, 토큰은 `globals.css`의 `@theme inline`
- 클래스 순서: 레이아웃 → 크기 → 간격 → 타이포그래피 → 색상 → 기타
- 린트 오류는 `eslint-disable`로 덮지 않는다

전문은 [`.claude/rules/`](.claude/rules) — `coding-conventions` · `structure` · `react` · `styling` · `data` · `state`.

## 커밋 규칙

```
<type>: <subject>
```

`feat` / `fix` / `refactor` / `style` / `docs` / `chore` / `test`

- 접두사는 영어, subject·body는 한글
- subject 50자 이내

작업이 끝나면 `pnpm lint` → `pnpm build`를 통과시키고 커밋한다.
