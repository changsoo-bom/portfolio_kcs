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

> **지금 `src/`의 코드는 전부 임시 뼈대다.** 원고도 디자인도 확정 전에 만든 것이라
> 확정본이 나오면 갈아엎는다. 새 기능을 여기에 쌓지 않는다.

**기준 문서는 Obsidian `portfolio-kcs/frontend_portfolio_claude_code_prompt.md`(작업 지시서)다.**
이 파일과 지시서가 어긋나면 지시서가 이긴다.

- 콘텐츠 원본 — Obsidian `portfolio-kcs/` (Profile 3 · Projects 5 · Tech 8 · Website 3)
- 구현 결정 — `portfolio-kcs/05_Website/portfolio-기획.md`
- 라우트·섹션 구조 — `portfolio-kcs/05_Website/Sitemap.md`

**현재 단계는 지시서 §22 — 웹사이트 코드를 작성하지 않는다.**
Obsidian TODO를 채우고 → Google Stitch 디자인 → 그다음 구현이다.

디자인은 **미확정**이다. `docs/design-reference.md`(Auros, 다크 전용)는 **보관**이며,
`globals.css`에 들어간 토큰도 임시다. Stitch 결과와 비교해 결정한다.

`.claude/rules/structure.md`의 나머지 폴더(`components/`, `hooks/`, `lib/`, `types/`)와
`(auth)` 라우트 그룹은 **미리 만들지 않았다.** 해당 코드가 실제로 생길 때 규칙대로 만든다.

| 경로 | 상태 |
|------|------|
| `/` | 히어로 + 인트로 커버 — **원고가 자리표시 문구다** |
| `/about` `/skills` `/work` `/contact` | 뼈대만. 내용 미작성 |

- 네비게이션은 모든 화면에서 **풀스크린 버거**(`app/_components/NavPop.tsx`).
  네이티브 `<dialog showModal()>`이라 포커스 트랩·Esc·포커스 복귀가 브라우저 기본 동작이다
- 인트로 커버는 첫 방문에만. `layout.tsx`의 head 인라인 스크립트가 `sessionStorage`를 읽어
  `<html data-intro="seen">`을 붙이고, 재생 여부는 CSS가 판단한다
- 원고는 `src/constants/profile.ts`. 확정본은 Obsidian `portfolio-kcs/portfolio-자기소개.md`
- 클라이언트 컴포넌트는 `NavPop` **하나뿐**. 나머지는 전부 서버 컴포넌트

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
