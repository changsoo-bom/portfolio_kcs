@AGENTS.md

# CLAUDE.md

포트폴리오 사이트 프로젝트.

## 스택

- **Next.js 16** App Router / Turbopack / React Compiler (`reactCompiler: true`)
- **React 19.2**
- **TypeScript** strict
- **Tailwind CSS v4** — CSS 기반 설정(`@theme inline`), `tailwind.config.js` 없음
- 패키지 매니저 **pnpm**

Zustand · TanStack Query · Zod · Prisma는 **아직 설치하지 않았다.**
`.claude/rules/state.md`의 판단 흐름에서 실제로 필요해진 시점에 추가한다.

## 현재 상태

`create-next-app` 직후 상태다. `src/app/`에 루트 `layout.tsx`·`page.tsx`(기본 템플릿)만 있다.

`.claude/rules/structure.md`의 `src/` 폴더들(`components/`, `hooks/`, `lib/`, `types/`, `constants/`)과
`(public)` / `(auth)` 라우트 그룹은 **미리 만들지 않았다.** 해당 코드가 실제로 생길 때 규칙대로 만든다.

| 경로 | 상태 |
|------|------|
| `/` | `create-next-app` 기본 페이지 — 교체 필요 |

## 상세 규칙

원본은 Obsidian vault `개발-공통규칙/`. 아래 6개는 매 세션 함께 로드된다.

- @.claude/rules/coding-conventions.md — TS strict, 네이밍, import 순서, 경로 별칭
- @.claude/rules/structure.md — `src/` 레이어링, 컴포넌트 도메인/기능 배치, 역할 접미사
- @.claude/rules/react.md — 서버/클라이언트 경계, React 19 패턴, Compiler 린트 규칙
- @.claude/rules/styling.md — Tailwind v4, 클래스 순서, 폰트
- @.claude/rules/data.md — 읽기=서버 컴포넌트 / 쓰기=Server Action, Zod 검증
- @.claude/rules/state.md — 서버 데이터 vs searchParams vs Zustand vs TanStack Query

각 파일의 `globs:` frontmatter는 어떤 작업에 해당하는 규칙인지 표시하는 용도다.

## 스킬

`.claude/skills/` 4개 — `next-best-practices`, `vercel-react-best-practices`,
`web-design-guidelines`, `agent-browser`. 상황에 맞게 자동으로 로드된다.

`frontend-design` · `ponytail` · `claude-mem`은 **PC 전역 플러그인**이라 여기서 할 일이 없다.
**이미 플러그인으로 있는 스킬을 `.claude/skills/`에 복사하지 않는다** — 사본이 갈라진다.

## Git Commit Message

```
<type>: <subject>
```

`feat` / `fix` / `refactor` / `style` / `docs` / `chore` / `test`

- 접두사는 영어, subject·body는 **한글**
- subject 50자 이내

## 작업 규칙

- 모든 답변과 추론 과정은 **한국어**로 작성한다
- task가 끝나면 **린트체크 → 타입체크 → 빌드체크**를 수행한다 (`pnpm lint`, `pnpm build`)
- 린트 오류는 반드시 해결하고 넘어간다. `eslint-disable`로 덮지 않는다
- task 완료 시 `CLAUDE.md` / `README.md` 업데이트가 필요하면 함께 진행한다
