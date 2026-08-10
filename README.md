# 🎨 포트폴리오 (portfolio_kcs)

개인 포트폴리오 웹사이트

## 📋 프로젝트 개요

작업물과 이력을 소개하는 개인 포트폴리오 사이트입니다.
Next.js 16 App Router 기반으로, 공개 페이지 성격에 맞춰 **서버 컴포넌트 우선 · SEO 우선**으로 설계합니다.

현재는 `create-next-app` 직후 상태이며, 개발 규칙과 프로젝트 골격을 먼저 확정한 단계입니다.

## 🛠️ 기술 스택

### Core
- **Next.js 16.3** - App Router, Turbopack
- **React 19.2** - React Compiler 활성화 (`reactCompiler: true`)
- **TypeScript 5** - strict 모드
- **pnpm 10.32** - 패키지 매니저

### 스타일링
- **Tailwind CSS 4** - CSS 기반 설정 (`@theme inline`), `tailwind.config.js` 없음
- **next/font** - Geist / Geist Mono, CSS 변수로 노출

### 도입 예정 (아직 미설치)

필요해지는 시점에 추가합니다. 미리 깔지 않습니다.

| 라이브러리 | 도입 조건 |
|-----------|----------|
| **Zod** | 외부 API 응답 · Server Action 입력 · searchParams 검증이 생길 때 |
| **Zustand** | 서버와 무관한 클라이언트 UI 상태(네비 열림 등)가 생길 때 |
| **TanStack Query** | 무한스크롤 등 클라이언트에서 이어붙이는 페칭이 생길 때 |
| **Prisma** | 자체 DB가 필요해질 때 |

## 🚀 시작하기

### 필수 요구사항
- Node.js 20.0.0 이상
- pnpm 10 이상 (`corepack enable`로 활성화 가능)

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행 (Turbopack)
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 린트 실행
pnpm lint
```

개발 서버는 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

### 스크립트

| 명령 | 설명 |
|------|------|
| `pnpm dev` | 개발 서버 (Turbopack) |
| `pnpm build` | 프로덕션 빌드 + 타입체크 |
| `pnpm start` | 빌드 결과물 서빙 |
| `pnpm lint` | ESLint (`eslint-config-next`) |

> 환경 변수는 아직 사용하지 않습니다. 외부 API를 붙이는 시점에 `.env.local` + `.env.example`을 함께 추가합니다.

## 📁 프로젝트 구조

레이어를 세로로 통과합니다. **각 단계는 아래 단계만 알고, 위 단계는 모릅니다.**
이 방향이 뒤집히면 순환 의존이 생깁니다.

```
types → schemas → lib/{api,queries} → components → app(route)
```

```
src/
├── app/                      # 라우팅 전용 (얇게 유지)
│   ├── (public)/             # 라우트 그룹 — 공개 영역
│   │   └── {domain}/
│   │       ├── page.tsx      #   목록 (필터는 searchParams)
│   │       ├── [id]/page.tsx #   상세
│   │       └── actions.ts    #   Server Action
│   ├── (auth)/               # 라우트 그룹 — 인증
│   ├── _components/          # 라우트 전용 프로바이더/셸
│   ├── layout.tsx            # 루트 레이아웃 (폰트, 메타데이터)
│   ├── page.tsx              # 홈
│   └── globals.css           # Tailwind + @theme inline 토큰
│
├── components/
│   ├── ui/                   # 전역 프리미티브 (Button, Pagination…)
│   ├── common/               # 공통 조합 컴포넌트 (index.ts 배럴)
│   └── {domain}/{feature}/   # 도메인 컴포넌트
│
├── hooks/                    # use-*.ts 클라이언트 훅
├── lib/                      # 외부 API 클라이언트, schemas/, prisma.ts, 스토어
├── types/                    # {domain}.ts
└── constants/
```

**폴더는 미리 만들지 않습니다.** 해당 코드가 실제로 생길 때 위 규칙대로 만듭니다.

### 현재 상태

| 경로 | 상태 |
|------|------|
| `src/app/layout.tsx` | 루트 레이아웃 — 폰트/메타데이터 설정 완료 |
| `src/app/page.tsx` | `create-next-app` 기본 페이지 — **교체 필요** |
| `src/app/globals.css` | Tailwind v4 + `@theme inline` 토큰 |
| `src/components` 이하 | 미생성 |
| `(public)` / `(auth)` | 미생성 |

### 컴포넌트 배치 규칙

경로: `src/components/{도메인}/{기능}/{PascalCase}.tsx`
예) `src/components/project/list/ProjectList.tsx`

역할별 접미사로 쪼갭니다. 한 페이지를 통짜 컴포넌트로 만들지 않습니다.

| 접미사 | 역할 | 예시 |
|--------|------|------|
| `List` | 목록/그리드 | `ProjectList.tsx` |
| `Filter` | 검색·필터 | `ProjectFilter.tsx` |
| `Card` | 목록의 한 항목 | `ProjectCard.tsx` |
| `Detail` | 상세 조회 | `ProjectDetail.tsx` |
| `Form` | 생성/편집 폼 | `ContactForm.tsx` |
| `Pop` | 팝업/모달 | `ImagePop.tsx` |

- `components/ui/` — 전역 프리미티브. **도메인 전용 컴포넌트를 두지 않습니다** (두면 잡동사니 서랍이 됩니다)
- `components/common/` — 여러 도메인이 공유하는 조합 컴포넌트, `index.ts` 배럴로 import
- **파일 하나 = 역할 하나**, `page.tsx`는 조립만

## 📐 코드 컨벤션

### TypeScript

- `strict: true`, **`any` 금지** — 불가피하면 `unknown` + 타입 가드
- 인터페이스에 `I` 접두사 금지 (`AppState`, ~~`IAppState`~~)
- 타입은 `import type`으로 import
- **`as` 단언 금지** — 검증이 필요하면 Zod `safeParse`

### Import

- **경로 별칭 `@/` 항상 사용. 상대 경로 `../` 금지**
  `../`가 나오는 순간 파일을 옮길 때마다 import가 깨집니다
- 순서: 외부 라이브러리 → 내부 모듈(`@/*`) → 상대 경로(CSS 등)

```typescript
import { useState } from 'react'

import { ProjectCard } from '@/components/project/list/ProjectCard'
import type { Project } from '@/types/project'

import './styles.css'
```

### 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 페이지/레이아웃 | 프레임워크 규칙 | `page.tsx`, `layout.tsx`, `loading.tsx` |
| 컴포넌트 (`components/` 하위) | **PascalCase** | `ProjectList.tsx` |
| 유틸·라이브러리·프로바이더 | kebab-case | `query-provider.tsx`, `date-utils.ts` |
| Server Action | 라우트 폴더의 `actions.ts` | `app/(public)/contact/actions.ts` |
| Zustand 스토어 | `use-{domain}-store.ts` | `use-nav-store.ts` |
| 타입 정의 | kebab-case | `project.ts` |
| 폴더 | kebab-case | `components/project/list/` |

**컴포넌트만 PascalCase, 나머지는 전부 kebab-case.**

### export

- 페이지·레이아웃: `export default function`
- 재사용 컴포넌트: **named export**

## ⚛️ React / Next.js 규칙

### 컴포넌트 경계

- 기본은 **서버 컴포넌트**. `"use client"`는 **실제로 상호작용하는 말단(leaf)에만** (입력, 폼, 모달)
- 페이지·레이아웃·목록 컨테이너는 서버 컴포넌트로 유지
- 목록을 통째로 클라이언트 컴포넌트로 만들면 SEO와 초기 로딩을 통째로 버립니다. **공개 페이지에서는 치명적입니다.**

### React 19 패턴

- **`forwardRef` 사용하지 않습니다.** ref를 일반 prop으로 받습니다
- Server → Client로 Promise를 넘길 때는 `use(promise)` + `<Suspense>`
  (초기 렌더 데이터는 서버에서 직접 `await`)
- ref 콜백에서 cleanup 함수를 반환하면 언마운트 시 자동 정리 (IntersectionObserver 등)
- Server Action과 짝지어 즉각 피드백이 필요하면 `useOptimistic` (실패 시 자동 롤백)
- 이미지는 `next/image`. 외부 호스트는 `next.config.ts`의 `images.remotePatterns`에 등록

### React Compiler

`next.config.ts`에 `reactCompiler: true`. `eslint-plugin-react-hooks` v7의 Compiler 전용 규칙이 적용됩니다.

- **`set-state-in-effect`** — `useEffect` 안에서 `setState` 금지
  - 읽기 전용 데이터 → 상태 대신 **파생 값으로 직접 계산** (`const value = data?.name ?? ''`)
  - 로컬 편집 상태가 필요하면 부모에서 **`key` prop으로 리마운트** 제어
- **`set-state-in-render`** — 렌더링 중 `setState` 금지
- 기타: `purity`, `immutability`, `refs`, `globals`, `use-memo`, `static-components`

> **`eslint-disable`로 덮지 않습니다.** Compiler는 규칙 준수를 전제로 메모이제이션을 넣기 때문에,
> 덮어두면 잘못된 전제로 최적화하고 증상은 엉뚱한 곳에서 나타납니다. 린트 에러 지점이 고칠 지점입니다.

## 🎨 스타일링 규칙

### Tailwind CSS v4

- **`tailwind.config.js`를 쓰지 않습니다.** 전역 토큰은 `src/app/globals.css`의 `@theme inline`에 정의
- 커스텀 색상은 CSS 변수로 정의하고 `@theme inline`으로 등록
- 다크 모드는 `prefers-color-scheme` 기반(시스템 설정 연동), `dark:` 접두사 사용

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

### 클래스 작성 순서

**레이아웃 → 크기 → 간격 → 타이포그래피 → 색상 → 기타**

```tsx
className="flex items-center w-full h-12 px-5 text-base font-medium text-background bg-foreground rounded-full transition-colors"
```

순서가 정해져 있으면 긴 클래스 문자열에서 원하는 걸 눈으로 빨리 찾습니다.

### Sass 미사용

**Tailwind 전용.** `.scss` 파일이나 `styles/` 디렉터리를 두지 않습니다.
폰트는 `next/font`로 로드하고 CSS 변수로 노출해 `@theme inline`에서 참조합니다. 별도 `@font-face` 금지.

## 🗂️ 데이터 & 상태 관리

### 읽기는 서버 컴포넌트, 쓰기는 Server Action

이 두 문장이 전부입니다.

### 데이터 종류마다 사는 곳이 다릅니다

| 데이터 종류 | 도구 | 위치 |
|-------------|------|------|
| 외부 API 데이터 | 서버 컴포넌트 + ISR | `lib/{api}/` |
| DB 데이터 | 서버 컴포넌트 + Prisma | `lib/prisma.ts` |
| 목록 필터·정렬·페이지 | **URL `searchParams`** | 라우트 |
| 클라이언트 전용 UI (네비 열림 등) | **Zustand** | `lib/use-{domain}-store.ts` |
| 무한스크롤 페칭 | **TanStack Query** | `hooks/` |

```
데이터가 서버에서 온다        → 서버 컴포넌트 (기본값)
  └ URL로 표현되는 상태다     → searchParams
  └ 클라이언트에서 이어붙인다 → TanStack Query
데이터가 서버와 무관하다      → Zustand
```

### 새 기능 추가 순서 (아래에서 위로)

```
1. src/types/{domain}.ts          — 타입 정의
2. src/lib/schemas/{domain}.ts    — Zod 스키마
3. src/lib/{api} 또는 prisma      — 데이터 소스 접근
4. src/app/.../actions.ts         — Server Action (쓰기)
5. src/components/{domain}/...    — 컴포넌트
6. src/app/.../page.tsx           — 라우트 조립
```

컴포넌트부터 만들면 타입이 나중에 따라오면서 `any`가 스며듭니다.

### Server Action 보안

**인증 → 검증 → 실행 → revalidate** 순서를 지킵니다. 세션 확인이 첫 줄입니다.

- **클라이언트에서 버튼을 숨긴 것은 인증이 아닙니다.** Server Action은 URL만 알면 직접 호출됩니다
- 권한 판별 시 null·예외값은 **더 낮은 권한으로 폴백**합니다 (fail-closed)
- 수정·삭제 쿼리의 `where`에 **작성자 조건을 반드시 포함**합니다
  누락 시 남의 글이 수정되는데 화면상 티가 안 나고 에러도 안 납니다

```typescript
// ❌ await prisma.post.update({ where: { id }, data })
await prisma.post.update({ where: { id, userId: session.user.id }, data })
```

### Zod 검증

**신뢰 경계를 넘는 곳에서만 검증합니다.**

| 상황 | 검증 |
|------|------|
| 외부 API 응답 | 필수 |
| Server Action 입력 (FormData) | 필수 |
| `searchParams` | 필수 |
| DB → 서버 컴포넌트 (Prisma) | 불필요 |

- `safeParse` 후 실패 시 원본 에러는 `console.error`, 사용자에겐 일반화된 메시지
- `transform` 안에서 `throw` 금지 → `ctx.addIssue` + `return z.NEVER`
- 날짜 문자열은 타임존을 명시합니다 — 안 박으면 서버(UTC)에서 하루 밀립니다 (`"2026-01-31T00:00:00+09:00"`)
- 배열은 일부 항목만 실패해도 유효한 것만 살리되, 몇 개가 걸러졌는지 `console.warn`으로 남깁니다
- 스키마 위치: `src/lib/schemas/{domain}.ts`, 공유 값은 `schemas/common.ts`에 단일 정의
- **Zod 에러 메시지는 그대로 사용자에게 보입니다** — 개발자 메모가 아닙니다

### 외부 API 실패는 국소화합니다

외부 API가 죽어도 사이트 전체가 죽으면 안 됩니다. 해당 서브트리에 자체 `error.tsx` 경계를 둡니다.
다른 영역 렌더 경로에서 외부 API를 동기적으로 기다리지 않습니다.
`lib/{api}/`가 파싱·검증·캐싱을 전담합니다 → **바깥은 검증된 타입만 봅니다.**

## 📝 개발 가이드

### 목록 페이지 — 필터는 searchParams

```tsx
// src/app/(public)/projects/page.tsx
import { ProjectList } from '@/components/project/list/ProjectList'
import { getProjects } from '@/lib/projects'

export default async function ProjectsPage({
  searchParams,
}: PageProps<'/projects'>) {
  const { tag } = await searchParams
  const projects = await getProjects({ tag })

  return <ProjectList projects={projects} />
}
```

뒤로가기·공유·SEO가 공짜로 따라옵니다.

### 상호작용은 말단 클라이언트 컴포넌트로

```tsx
// src/components/project/list/ProjectFilter.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function ProjectFilter({ tags }: { tags: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ...
}
```

### 파생 값은 상태로 만들지 않습니다

```tsx
// ❌ useEffect + setState
// ✅ 렌더 중 직접 계산
const displayName = user?.name ?? '이름 없음'
```

### Server Action

```typescript
// src/app/(public)/contact/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { contactSchema } from '@/lib/schemas/contact'

export async function submitContact(formData: FormData) {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    console.error(parsed.error)
    return { error: '입력값을 확인해 주세요.' }
  }

  // ... 실행

  revalidatePath('/contact')
  return { ok: true }
}
```

## 🔀 Git 컨벤션

### 커밋 메시지

```
<type>: <subject>
```

| type | 용도 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 동작 변경 없는 구조 개선 |
| `style` | 포맷·스타일 (로직 변경 없음) |
| `docs` | 문서 |
| `chore` | 빌드·설정·의존성 |
| `test` | 테스트 |

- 접두사는 영어, subject·body는 **한글**
- subject 50자 이내

```
feat: 프로젝트 목록 필터 추가

태그별 필터를 searchParams로 처리하도록 구현.
```

### 브랜치

| 브랜치 | 용도 |
|--------|------|
| `master` | 배포 기준 |
| `development` | 작업 브랜치 |

## ✅ 작업 체크리스트

작업이 끝나면 순서대로 확인합니다.

1. `pnpm lint` — 린트 통과 (`eslint-disable`로 덮지 않습니다)
2. `pnpm build` — 타입체크 + 빌드 통과
3. `README.md` / `CLAUDE.md` 업데이트 필요 여부 확인
4. 커밋 (컨벤션 준수)

## 📚 상세 규칙 문서

전문은 [`.claude/rules/`](.claude/rules)에 있습니다. AI 에이전트 세션에 자동 로드됩니다.

| 파일 | 내용 |
|------|------|
| [`coding-conventions.md`](.claude/rules/coding-conventions.md) | TS strict, 네이밍, import 순서, 경로 별칭 |
| [`structure.md`](.claude/rules/structure.md) | `src/` 레이어링, 컴포넌트 도메인/기능 배치, 역할 접미사 |
| [`react.md`](.claude/rules/react.md) | 서버/클라이언트 경계, React 19 패턴, Compiler 린트 규칙 |
| [`styling.md`](.claude/rules/styling.md) | Tailwind v4, 클래스 순서, 폰트 |
| [`data.md`](.claude/rules/data.md) | 읽기=서버 컴포넌트 / 쓰기=Server Action, Zod 검증 |
| [`state.md`](.claude/rules/state.md) | 서버 데이터 vs searchParams vs Zustand vs TanStack Query |

프로젝트 개요와 AI 작업 규칙은 [`CLAUDE.md`](CLAUDE.md)를 참고하세요.

---

**김창수 개인 포트폴리오**
