@AGENTS.md

# CLAUDE.md

포트폴리오 사이트 프로젝트.

## 스택

- **Next.js 16** App Router / Turbopack / React Compiler (`reactCompiler: true`)
- **React 19.2**
- **TypeScript** strict
- **Tailwind CSS v4** — CSS 기반 설정(`@theme inline`), `tailwind.config.js` 없음
- 패키지 매니저 **pnpm**

- **anime.js 4.5** — 인트로 타임라인 전용. 스크롤 애니메이션은 CSS가 맡는다

Zustand · TanStack Query · Zod · Prisma는 **아직 설치하지 않았다.**
`.claude/rules/state.md`의 판단 흐름에서 실제로 필요해진 시점에 추가한다.

## 현재 상태

> **7개 라우트를 Obsidian 확정 원고 + Stitch 디자인 기준으로 구현했다** (2026-08-11).
> 더 이상 임시 뼈대가 아니다. 다만 원고에 남은 TODO는 여전히 TODO다.

**기준 문서는 Obsidian `portfolio-kcs/frontend_portfolio_claude_code_prompt.md`(작업 지시서)다.**
이 파일과 지시서가 어긋나면 지시서가 이긴다.

- 콘텐츠 원본 — Obsidian `portfolio-kcs/` (Profile 3 · Projects 5 · Tech 8 · Website 3)
- 구현 결정 — `portfolio-kcs/05_Website/portfolio-기획.md`
- 라우트·섹션 구조 — `portfolio-kcs/05_Website/Sitemap.md`

디자인은 `docs/design-reference.md`(Stitch 산출본 — 라이트 에디토리얼, Inter + JetBrains Mono).
`globals.css`의 토큰이 그 기준으로 교체됐다. 이전 Auros(다크)는 커밋 `5448a13` 이전 히스토리에 있다.

Stitch 산출물을 그대로 옮기지 않았다 — 레퍼런스 상단 "적용 전 해결해야 할 것" 10개 중
**근거 없는 성과 수치·`STUDIO.DEV` 브랜드명·만료되는 이미지 URL은 넣지 않았다.**

네비게이션은 **Stitch 쪽으로 결정했다**(2026-08-11) — 데스크톱 가로 메뉴 + 모바일 버거.
Obsidian `portfolio-기획.md`의 "모든 화면 풀스크린 버거"는 이 결정으로 대체됐다.

`.claude/rules/structure.md`의 `hooks/`, `lib/`와 `(auth)` 라우트 그룹은
**미리 만들지 않았다.** 해당 코드가 실제로 생길 때 규칙대로 만든다.

| 경로 | 상태 |
|------|------|
| `/` | 히어로 + 인트로 커버 |
| `/about` | Intro · 강점 · 약점 |
| `/experience` | 경력 2개 + 성장 축 |
| `/work` | 프로젝트 5개 (`order` 순 — 시간순 아님) |
| `/tech` | 기술 8개 |
| `/how-i-work` | AI Workflow 5단계 + Build Process |
| `/contact` | 이메일 · GitHub (`mailto:`, 폼 없음) |

`/work/[id]` 상세는 **아직 만들지 않았다** — Overview·Challenge·Approach가 채워진 프로젝트가
3개 이상일 때 만든다(기획 §라우트 구조). 프로젝트 5개 중 4개의 `period`가 비어 있다.

- 네비게이션은 `app/_components/SiteNav.tsx` **하나**가 담당한다 —
  `lg:`(1024px) 이상은 가로 메뉴, 그 아래는 **풀스크린 버거**.
  전환 기준이 `md:`가 아닌 이유는 메뉴 6개(`HOW I WORK` 포함) 가로 폭이 ~525px라 로고와 겹쳐서다
- 버거는 네이티브 `<dialog showModal()>`이라 포커스 트랩·Esc·포커스 복귀가 브라우저 기본 동작이다
- 현재 경로 표시(`usePathname`) 때문에 클라이언트 컴포넌트다
- 인트로 커버는 첫 방문에만. `layout.tsx`의 head 인라인 스크립트가 `sessionStorage`를 읽어
  `<html data-intro="seen">`을 붙이고, 재생 여부는 CSS가 판단한다
- 원고·데이터는 `src/constants/` 4개 — `profile.ts`(PROFILE·NAV_ITEMS·COPY) ·
  `projects.ts` · `tech.ts` · `experience.ts`. **원본은 Obsidian이고 여기는 사본이다.**
  문구를 고칠 때 컴포넌트를 열지 않는다
- 프로젝트 데이터는 마크다운 파싱이 아니라 **TS 상수**다 — 파일이 5개뿐이라서다(기획 §데이터 모델).
  늘어나면 빌드 타임 파싱으로 바꾼다
- 인트로 커버는 **anime.js 타임라인**(`app/_components/IntroCover.tsx`) —
  글자 등장 → 카운터 0→100 + 진행 바 → 커버가 위로 걷힘.
  네 단계가 물려 있어 CSS 키프레임 네 벌보다 타임라인 하나가 읽기 쉽다
- **스크롤 애니메이션은 anime.js를 쓰지 않는다.** CSS `animation-timeline`이 같은 일을 하는데
  JS가 0줄이고 서버 컴포넌트를 클라이언트로 바꾸지 않아도 된다
- 클라이언트 컴포넌트는 `SiteNav` · `IntroCover` **둘뿐**. 나머지는 전부 서버 컴포넌트

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
