# Style Reference — Google Stitch 산출본

> Editorial laboratory — 흑백 활자 중심의 라이트 캔버스

**Theme:** light (다크 대응 없음)
**출처:** Google Stitch MCP, 2026-08-11 생성. 화면 9종 + 디자인 시스템 1종
**이전 레퍼런스:** Auros(다크 전용)는 커밋 `5448a13` 이전 히스토리에 있다. 이 문서가 대체한다.

토큰 값의 원본은 여기이고, 실제 적용은 `src/app/globals.css`의 `@theme inline`에 넣는다.
작성 규칙(클래스 순서, `tailwind.config.js` 미사용 등)은 [`.claude/rules/styling.md`](../.claude/rules/styling.md)를 따른다.

---

## ⚠️ 적용 전 해결해야 할 것

Stitch 산출물을 그대로 코드로 옮기면 안 되는 지점들. **순서대로 결정하고 나서 구현에 들어간다.**

| # | 항목 | Stitch 산출물 | 이 프로젝트 | 처리 |
|---|------|--------------|------------|------|
| 1 | ~~**네비게이션**~~ | 데스크톱 `TopNavBar` + 모바일 버거 | — | **해결(2026-08-11).** Stitch 쪽 채택 — `SiteNav.tsx`에서 `lg:` 이상 가로 메뉴, 그 아래 버거 |
| 2 | **라우트** | EXPLORE / WORK / STACK / ABOUT / CONTACT | `Sitemap.md`의 7개 | 이름·개수 대조 필요 |
| 3 | **브랜드명** | `STUDIO.DEV` | 미확정 | **전부 자리표시.** 확정 전엔 코드에 박지 않는다 |
| 4 | **다크모드** | 없음 (`darkMode:"class"`는 선언만, 다크 값이 라이트와 동일) | `prefers-color-scheme` 기반 | 라이트 고정으로 갈지 결정 |
| 5 | **Tailwind** | v3 CDN + `tailwind.config` | **v4 `@theme inline`** | 아래 Quick Start로 변환 |
| 6 | **폰트** | Google Fonts `<link>` | `next/font` | `@font-face`·CDN link 금지 |
| 7 | **이미지** | `lh3.googleusercontent.com/aida-public/…` | — | Stitch 임시 URL. 만료된다. 실제 에셋 필요 |
| 8 | **성과 수치** | "LCP 42% 개선", "개발 속도 3x" | — | **Stitch가 지어낸 값.** 검증 안 되면 삭제 |
| 9 | **본문 카피** | 영문 위주, 일부 KR/EN 병기 | 원고 미확정 | Obsidian 확정본이 이긴다 |
| 10 | **Three.js** | 히어로 파티클 2종 | — | 두 스니펫 모두 `const container` **중복 선언 → SyntaxError**. 그대로 쓰면 안 뜬다 |

---

## 성격

흑백 활자가 화면을 지배한다. 색은 정보 위계에만 쓰이고 장식으로는 거의 등장하지 않는다.
회색조 표면 스택(`#ffffff` → `#faf9f9` → `#f4f3f3` → `#efeded` → `#e9e8e8`)이 카드와 섹션을 가르고,
그림자 대신 **1px 헤어라인 보더**(`rgba(142,142,142,0.2~0.3)`)가 경계를 만든다.

두 서체가 역할을 나눈다 — Inter가 내용을, JetBrains Mono가 **계측 라벨**(연도·상태·기술스택·섹션 번호)을 맡는다.
모노 라벨은 항상 대문자에 `0.05em` 트래킹이 붙어, 화면이 실험 기록지처럼 읽힌다.

모서리는 거의 각져 있다. 가장 큰 반경이 12px이고 기본은 2px다. 알약 버튼도, 큰 라운드 카드도 없다.
이미지는 기본적으로 `grayscale`이고 호버에서만 색이 돌아온다.

---

## Tokens — Colors

Material 3 계열 네이밍. **크로마가 거의 0인 회색조**이며, 유일한 유채색은 에러 계열과 tertiary(남색)다.

### 핵심 (실제로 쓰이는 것)

| Name | Value | Token | Role |
|------|-------|-------|------|
| primary | `#000000` | `--color-primary` | 제목·강조 텍스트, 채워진 버튼 배경, 푸터 캔버스 |
| on-primary | `#ffffff` | `--color-on-primary` | primary 위의 텍스트 |
| background / surface | `#faf9f9` | `--color-background` | 페이지 캔버스 |
| on-surface | `#1b1c1c` | `--color-on-surface` | 본문 기본 텍스트 |
| on-surface-variant | `#444748` | `--color-on-surface-variant` | 보조 본문·설명 |
| secondary | `#5e5e5e` | `--color-secondary` | 라벨·메타 텍스트 (모노 라벨의 기본색) |
| outline | `#747878` | `--color-outline` | 보더 기준색. 실제로는 `/20`~`/30` 알파로만 씀 |
| outline-variant | `#c4c7c7` | `--color-outline-variant` | 더 옅은 구분선 |

### 표면 스택

| Level | Token | Value | 쓰임 |
|-------|-------|-------|------|
| 0 | `surface-container-lowest` | `#ffffff` | 가장 밝은 패널 (아키텍처 플로우 박스) |
| 1 | `background` / `surface` / `surface-bright` | `#faf9f9` | 페이지 캔버스 |
| 2 | `surface-container-low` | `#f4f3f3` | 섹션 밴드, 리스트 행 호버 |
| 3 | `surface-container` | `#efeded` | 코드 블록 배경 |
| 4 | `surface-container-high` / `surface-variant` / `surface-container-highest` | `#e9e8e8` / `#e3e2e2` | 이미지 플레이스홀더 |
| — | `surface-dim` | `#dbdad9` | 비활성 표면 |

### 나머지 (선언은 됐으나 거의 안 쓰임)

`primary-container #1c1b1b` · `on-primary-container #858383` · `primary-fixed #e5e2e1` · `primary-fixed-dim #c8c6c5` ·
`on-primary-fixed #1c1b1b` · `on-primary-fixed-variant #474746` ·
`secondary-container #e0dfdf` · `on-secondary-container #626362` · `secondary-fixed #e3e2e1` · `secondary-fixed-dim #c7c6c5` ·
`on-secondary #ffffff` · `on-secondary-fixed #1a1c1c` · `on-secondary-fixed-variant #464746` ·
`tertiary #000000` · `tertiary-container #111c2c` · `on-tertiary #ffffff` · `on-tertiary-container #798499` ·
`tertiary-fixed #d8e3fa` · `tertiary-fixed-dim #bcc7dd` · `on-tertiary-fixed #111c2c` · `on-tertiary-fixed-variant #3c475a` ·
`inverse-surface #2f3031` · `inverse-on-surface #f2f0f0` · `inverse-primary #c8c6c5` · `surface-tint #5f5e5e` ·
`on-background #1b1c1c`

**에러 계열:** `error #ba1a1a` · `on-error #ffffff` · `error-container #ffdad6` · `on-error-container #93000a`
— 실제 사용처는 접근 제한 배지(HANASYS `RESTRICTED (VPN)`) 하나뿐이다.

### 토큰 밖에서 하드코딩된 값

Stitch가 토큰을 안 쓰고 직접 박아둔 것들. **정리해서 토큰으로 흡수할지 결정해야 한다.**

| Value | 쓰임 |
|-------|------|
| `#FDFCFB` | 카드 배경, 일부 페이지의 `body` 배경 — `background`(`#faf9f9`)와 미묘하게 다르다 |
| `#1A1A1A` | 버튼 배경 (`HIRE ME`), 타임라인 점 |
| `#4A5568` | 버튼 호버, 카드 제목 호버, **Three.js 파티클 색**(`0x4A5568`) — 사실상 유일한 액센트 |
| `rgba(142,142,142,0.3)` | `.editorial-divider` — 섹션 상단 구분선 |
| `rgba(142,142,142,0.2)` | `.hairline-border` — 카드 테두리 |
| `rgba(142,142,142,1)` | `.chip` 테두리 |

---

## Tokens — Typography

### Inter — 본문·제목

`--font-inter` · Weights 400 / 500 / 600 / 700 / 900

### JetBrains Mono — 계측 라벨·데이터

`--font-jetbrains-mono` · Weights 400 / 500

라벨·연도·상태·기술스택 칩·섹션 번호(`01.`, `LAB / 02`)·코드 블록. **화면의 성격을 만드는 서체다.**

### Type Scale

| Role | Size | Line Height | Letter Spacing | Weight | Face |
|------|------|-------------|----------------|--------|------|
| `display` | 80px | 1.1 | -0.04em | 700 | Inter |
| `headline-lg` | 48px | 1.2 | -0.02em | 600 | Inter |
| `headline-lg-mobile` | 32px | 1.2 | -0.02em | 600 | Inter |
| `headline-md` | 24px | 1.4 | -0.01em | 500 | Inter |
| `body-lg` | 18px | 1.6 | — | 400 | Inter |
| `body-sm` | 15px | 1.6 | — | 400 | Inter |
| `mono-data` | 14px | 1.5 | — | 400 | JetBrains Mono |
| `mono-label` | 13px | 1.2 | 0.05em | 500 | JetBrains Mono |

**반응형:** `display`는 모바일에서 48px로 내린다 (`md:text-[80px] text-[48px]`).
별도 `headline-lg-mobile` 토큰도 있지만 실제로는 `md:` 분기로 처리한 곳이 더 많다 — **하나로 통일해야 한다.**

**모노 라벨은 항상 `uppercase` + `tracking-widest`가 덧붙는다.** 토큰의 `0.05em` 위에 유틸리티가 한 번 더 얹히는 구조라, 실측 트래킹은 더 넓다.

---

## Tokens — Spacing & Shapes

**Base unit:** 8px

| Token | Value | 쓰임 |
|-------|-------|------|
| `base` | 8px | 기본 단위, 네비 세로 패딩 |
| `gutter` | 24px | 그리드 거터, 요소 간격 |
| `margin-mobile` | 20px | 모바일 좌우 여백 |
| `margin-desktop` | 64px | 데스크톱 좌우 여백 |
| `section-gap` | 120px | 섹션 사이 세로 간격 |
| `container-max` | 1280px | 콘텐츠 최대 폭 |

### Border Radius

| Token | Value |
|-------|-------|
| `DEFAULT` | 2px (`0.125rem`) |
| `lg` | 4px (`0.25rem`) |
| `xl` | 8px (`0.5rem`) |
| `full` | 12px (`0.75rem`) |

**`full`이 12px다 — 알약이 아니다.** 각진 인상이 이 스케일에서 나온다.

### Grid

| Breakpoint | Columns | Gutter | Margin |
|------------|---------|--------|--------|
| mobile | 4 | 24px | 20px |
| `md:` 768px | 8 | 24px | 64px |
| `lg:` 1024px | 12 | 24px | 64px (max 1280px, 중앙 정렬) |

실제 마크업은 `grid-cols-4 md:grid-cols-12`로 8컬럼 단계를 건너뛴 곳이 많다. **태블릿 레이아웃은 검증이 안 됐다.**

---

## Components

### TopNavBar — 사이트 헤더
`fixed`/`sticky top-0`, `bg-surface/80 backdrop-blur-md`, 하단 `border-b border-outline/20`.
좌측 워드마크(`headline-md` 700, `tracking-tighter`), 중앙 링크 5개(`mono-label` 대문자 `tracking-widest`), 우측 CTA 버튼.
활성 링크는 `border-b-2 border-primary pb-1`. 모바일에서는 2줄 버거 아이콘으로 접힌다.
> 채택함(`SiteNav.tsx`). 단 전환 기준은 `md:`가 아니라 **`lg:`(1024px)** 다 —
> 메뉴가 6개고 `HOW I WORK`이 길어서 768px에서는 로고와 겹친다.
> CTA 버튼(`LET'S BUILD`)은 넣지 않았다. CONTACT 메뉴와 중복이다.

### Intro Loader — 첫 진입 커버
`fixed inset-0 z-[100]`, 배경에 Three.js 파티클. 중앙에 모노 라벨이 400ms 간격으로
`INITIALIZING… → EXPLORING… → BUILDING… → EVOLVING…`으로 바뀌고, 그 아래 1px 진행 바가 2000ms에 걸쳐 찬다.
2초 뒤 커버가 위로 걷히고(`translate-y-full`, 1.2s `cubic-bezier(.77,0,.175,1)`),
600ms 지점에서 히어로 제목이 **글자당 35ms**로 순차 등장, 1800ms에 네비가 페이드인.
> 현재 구현(`intro-cover` + `sessionStorage`)과 타이밍·연출이 다르다. 대조 필요.

### Hero — 홈 히어로
`min-h-[921px]`, 12컬럼 중 10컬럼 차지. 모노 데이터 아이브로우 → `display` 제목 → 하단 구분선 아래 "CURRENTLY EXPLORING" 블록.
우측 끝에 `north_east` 아이콘이 `animate-pulse`.

### Case Study Header — 프로젝트 상세 헤더
`mono-label` 아이브로우(`Case Study — 2024`) → `display` 제목(`01 — HANWHA Q.PARTNERS`) →
상단 구분선 아래 메타 3~4열(ROLE / TIMELINE / STATUS / TECH STACK).

### Tech Chip — 기술 스택 칩
`px-3 py-1`, 1px 헤어라인 보더, `rounded` (2px), `mono-label`. 배경 투명. 채워진 배지가 아니다.

### Sticky Section Label — 섹션 번호
`01. Technical Overview` 형태의 `mono-label` 대문자를 좌측 4컬럼에 `sticky top-32`로 고정하고,
우측 8컬럼에 본문이 흐른다. 케이스 스터디 본문의 기본 골격.

### Stat Card — 성과 카드
`aspect-square`, `bg-[#FDFCFB]`, 헤어라인 보더, `p-8`. 상단에 `mono-label` 지표명,
하단에 `display` 크기 숫자 + `body-sm` 설명. 호버 시 `bg-surface-variant/30`.
> ⚠️ Stitch가 채운 수치(42%, 3x)는 근거 없음. 표 #8.

### Archive Row — 인덱스 리스트 행
12컬럼 테이블 행: `No.`(모노) / 프로젝트명(`headline-md`) / 역할(`body-sm`) / 연도(모노) / 상태 배지(우측 정렬).
호버 시 행 배경 `#f4f3f3`, 번호 색이 `outline → primary`로. 모바일에서는 4컬럼으로 접힌다.

### Status Badge — 상태 배지
`px-2 py-1`, 헤어라인 보더, `rounded`(2px), `mono-label` 10px. `LIVE` / `RESTRICTED` / `DEPRECATED` / `OPEN SOURCE`.

### Lab Card — 실험 카드
`aspect-[4/3]` 이미지가 `grayscale`로 시작해 호버 시 `grayscale-0 + scale-105` (700ms).
아래 구분선 위에 `LAB / 01` + 상태·빌드 라벨, 그 밑 `headline-md` 제목(호버 시 `#4A5568`).
카드마다 `md:mt-16`으로 세로 오프셋을 줘 비대칭 배치.

### Filter Button — 스택 필터
`px-4 py-2`, 헤어라인 보더, `rounded`(2px), `mono-label` 대문자.
활성 시 `bg-#1a1a1a text-white border-#1a1a1a`. 비활성 카드는 `opacity-.3 + grayscale(100%)`로 죽인다(숨기지 않는다).

### Timeline — 연도별 진화
중앙 1px 세로선(모바일은 좌측 20px). 각 항목은 12컬럼을 좌우로 갈라 배치하고 좌우가 번갈아 뒤집힌다.
현재 시점 점만 `bg-primary`, 과거는 `bg-outline`. 점은 `border-4 border-surface`로 선을 끊는다.

### Device Frame — 반응형 쇼케이스
Mobile 280×580 / Tablet 380×500 / Desktop 가변×420. `rounded-xl`(8px) + 헤어라인 보더.
내부는 실제 스크린샷이 아니라 **회색 블록 와이어프레임**(`bg-outline/10`, `bg-outline/5`)이다.

### Footer — 사이트 푸터
두 종류가 섞여 있다. **하나로 정해야 한다.**
- **라이트형**: `bg-surface`, 상단 보더, `headline-lg` 900 워드마크 + 링크 4개
- **다크형**: `bg-primary`(검정), `min-h-[614px]`, `display` 크기 워드마크가 하단 정렬.
  링크 호버 시 `tracking-widest`로 벌어지는 500ms 트랜지션

### Architecture Flow — 단계 다이어그램
`bg-surface-container-low` 패널 안에 흰 박스 3개를 `arrow_forward` 아이콘으로 연결.
데스크톱 가로, 모바일에서는 화살표가 `rotate-90` 되어 세로로.

### Restricted Overlay — 접근 제한 표시
배경 이미지 위에 `bg-surface/90 backdrop-blur-sm` 패널. `SYSTEM.RESTRICTED_ACCESS` 모노 제목,
설명, 신호등 점 3개(첫 번째만 `bg-error`). 스크린샷을 못 넣는 프로젝트의 대체 표현.

---

## Motion

| 대상 | 값 |
|------|-----|
| 링크·색상 전환 | 200~300ms |
| 이미지 grayscale 해제 + scale | 700ms |
| 인트로 커버 마스크업 | 1200ms `cubic-bezier(.77,0,.175,1)` |
| 히어로 글자 등장 | 글자당 35ms 스태거, 각 700ms `cubic-bezier(.2,.6,.2,1)` |
| 푸터 링크 트래킹 확장 | 500ms |
| 카드 호버 scale | `scale-105`, 700ms |

`prefers-reduced-motion` 대응이 **Stitch 산출물에 전혀 없다.** 구현 시 직접 넣는다.

---

## Do's and Don'ts

### Do
- 색은 위계에만 쓴다 — 텍스트는 `#1b1c1c` → `#444748` → `#5e5e5e` 3단계로 내려간다
- 경계는 **1px 헤어라인**(`border-outline/20`)으로. 그림자는 쓰지 않는다
- 라벨·연도·상태·기술명은 **전부 JetBrains Mono 대문자 + 넓은 트래킹**
- 섹션 번호(`01.` `02.`)를 붙이고 좌측에 `sticky`로 고정한다
- 이미지는 `grayscale`로 두고 호버에서만 색을 돌려준다
- 큰 제목은 `tracking-tighter`(-0.02~-0.04em)로 조인다
- 표면 차이는 회색 5단계 스택 안에서만 만든다

### Don't
- 알약 버튼을 만들지 않는다 — 최대 반경이 12px다
- `box-shadow`로 띄우지 않는다 (`shadow-sm`이 몇 군데 있지만 거의 안 보인다)
- 유채색을 장식으로 쓰지 않는다 — 에러 계열은 접근 제한 배지 전용
- 본문에 순수 검정(`#000000`)을 쓰지 않는다 — 본문은 `#1b1c1c`, 검정은 제목·버튼·푸터용
- 모노 서체를 본문에 쓰지 않는다 — 라벨과 데이터 전용
- 섹션 간격을 120px보다 좁히지 않는다

---

## Screens (Stitch 산출)

| # | 화면 | 상태 |
|---|------|------|
| 1 | Home — 히어로 | 정적 |
| 2 | Home — 인트로 모션 포함 | 로더 + 글자 스태거 |
| 3 | Project 01 — Hanwha Q.partners | 성과 수치 있음(⚠️ 미검증) |
| 4 | Project 02 — 힘이나는 커피생활 BO | EN / KR·EN 병기 2벌 |
| 5 | Project 03 — HANASYS DESIGN | EN / KR·EN 병기 2벌, 접근 제한 표현 |
| 6 | Project 04 — CJ FreshWay | EN / KR·EN 병기 2벌, 디바이스 프레임 |
| 7 | Lab / Experiments | 3개 실험 카드 |
| 8 | Index / Archive | 테이블 리스트 5행 + LOAD PREVIOUS |
| 9 | Stack & Evolution | 필터 + 벤토 그리드 + 타임라인 |

프로젝트 5개 중 **대한약사회가 빠졌다.** Obsidian `01_Projects/`와 대조 필요.

---

## Quick Start — Tailwind v4

`src/app/globals.css`의 `@theme inline`에 넣는다. `tailwind.config.js`는 만들지 않는다.
Stitch의 `tailwind.config` 블록은 **버린다** — 아래가 변환 결과다.

```css
@theme {
  /* Colors — 핵심 */
  --color-primary: #000000;
  --color-on-primary: #ffffff;
  --color-background: #faf9f9;
  --color-surface: #faf9f9;
  --color-on-surface: #1b1c1c;
  --color-on-surface-variant: #444748;
  --color-secondary: #5e5e5e;
  --color-outline: #747878;
  --color-outline-variant: #c4c7c7;

  /* Colors — 표면 스택 */
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #f4f3f3;
  --color-surface-container: #efeded;
  --color-surface-container-high: #e9e8e8;
  --color-surface-container-highest: #e3e2e2;
  --color-surface-dim: #dbdad9;
  --color-surface-variant: #e3e2e2;

  /* Colors — 에러 (접근 제한 배지 전용) */
  --color-error: #ba1a1a;
  --color-on-error: #ffffff;
  --color-error-container: #ffdad6;
  --color-on-error-container: #93000a;

  /* Colors — 하드코딩되어 있던 값 (위 표 참조) */
  --color-card: #fdfcfb;
  --color-ink: #1a1a1a;
  --color-accent: #4a5568;

  /* Typography */
  --font-sans: var(--font-inter);
  --font-mono: var(--font-jetbrains-mono);

  --text-display: 80px;
  --leading-display: 1.1;
  --tracking-display: -0.04em;

  --text-headline-lg: 48px;
  --leading-headline-lg: 1.2;
  --tracking-headline-lg: -0.02em;

  --text-headline-md: 24px;
  --leading-headline-md: 1.4;
  --tracking-headline-md: -0.01em;

  --text-body-lg: 18px;
  --leading-body-lg: 1.6;

  --text-body-sm: 15px;
  --leading-body-sm: 1.6;

  --text-mono-data: 14px;
  --leading-mono-data: 1.5;

  --text-mono-label: 13px;
  --leading-mono-label: 1.2;
  --tracking-mono-label: 0.05em;

  /* Spacing */
  --spacing-base: 8px;
  --spacing-gutter: 24px;
  --spacing-margin-mobile: 20px;
  --spacing-margin-desktop: 64px;
  --spacing-section-gap: 120px;

  /* Border Radius */
  --radius-DEFAULT: 0.125rem;
  --radius-lg: 0.25rem;
  --radius-xl: 0.5rem;
  --radius-full: 0.75rem;
}

:root {
  /* 헤어라인 — outline의 알파 변형을 반복해 쓴다 */
  --hairline: rgba(142, 142, 142, 0.2);
  --divider: rgba(142, 142, 142, 0.3);

  /* 콘텐츠 최대 폭 — @theme의 spacing이 아니라 max-w로 쓴다 */
  --container-max: 1280px;
}
```

**폰트는 `next/font`로 로드하고 CSS 변수로 노출한다.** Stitch의 Google Fonts `<link>`는 쓰지 않는다.

```ts
// src/app/layout.tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });
```

---

## Three.js 히어로 — 쓰려면 고쳐야 한다

Stitch가 낸 두 스니펫 모두 **같은 스코프에 `const container`를 두 번 선언**해서 `SyntaxError`로 죽는다.
두 번째 스니펫은 IIFE가 이중으로 중첩돼 있기도 하다.

원래 의도:
- 파티클 1000~2000개를 10×10×10 큐브에 랜덤 배치
- `PointsMaterial` — 색 `0x4A5568` 또는 `0x1a1a1a`, size 0.005~0.02, opacity 0.4~0.5
- `rotation.y += 0.001`, `rotation.x += 0.0005` 상시 회전
- 마우스 위치로 카메라를 `0.05` 계수로 부드럽게 따라가게
- `alpha: true`로 배경 투명 → 라이트 캔버스 위에 얹힘

**three.js r125를 CDN으로 부르는 것도 그대로 쓰면 안 된다.** npm 의존성으로 넣거나, 파티클을 CSS/SVG로 대체할지 결정한다.
`prefers-reduced-motion`에서 정지시키는 처리도 없다.
