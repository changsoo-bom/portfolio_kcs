---
globs:
  - "src/app/**"
  - "src/lib/**"
  - "src/types/**"
  - "prisma/**"
---
### 읽기는 서버 컴포넌트, 쓰기는 Server Action

이 두 문장이 전부다.

#### 새 기능 추가 순서 (아래에서 위로)

```
1. src/types/{domain}.ts          — 타입 정의
2. src/lib/schemas/{domain}.ts    — Zod 스키마
3. src/lib/{api} 또는 prisma      — 데이터 소스 접근
4. src/app/.../actions.ts         — Server Action (쓰기)
5. src/components/{domain}/...    — 컴포넌트
6. src/app/.../page.tsx           — 라우트 조립
```

컴포넌트부터 만들면 타입이 나중에 따라오면서 `any`가 스며든다.

#### 읽기

- 필터·정렬·페이지는 **`searchParams`로 받는다.** 클라이언트 state로 들고 있지 않는다
  → 뒤로가기·공유·SEO가 공짜로 따라온다
- 외부 API 호출은 `lib/` 경유. ISR(`revalidate`)로 캐싱하고 **캐시 키에 필터 파라미터를 빠짐없이 반영**

#### 쓰기 — Server Action

**Route Handler를 새로 만들지 않는다** (Auth.js 콜백처럼 라이브러리가 요구하는 경우만 예외).

**인증 → 검증 → 실행 → revalidate** 순서를 지킨다. 세션 확인이 첫 줄이다.

- **클라이언트에서 버튼을 숨긴 것은 인증이 아니다.** Server Action은 URL만 알면 직접 호출된다
- 권한 판별 시 null·예외값은 **더 낮은 권한으로 폴백**한다(fail-closed)
- 수정·삭제 쿼리의 `where`에 **작성자 조건을 반드시 포함**한다 — 누락 시 남의 글이 수정되는데 화면상 티가 안 나고 에러도 안 난다

```ts
// ❌ await prisma.post.update({ where: { id }, data });
await prisma.post.update({ where: { id, userId: session.user.id }, data });
```

#### 외부 API 실패는 국소화한다

외부 API가 죽어도 사이트 전체가 죽으면 안 된다. 해당 서브트리에 자체 `error.tsx` 경계를 둔다.
다른 영역 렌더 경로에서 외부 API를 동기적으로 기다리지 않는다.
`lib/{api}/`가 파싱·검증·캐싱을 전담한다 → **바깥은 검증된 타입만 본다.**

#### Prisma

- 클라이언트는 `src/lib/prisma.ts` **싱글톤** — 앱 전체에서 이것만 사용
- 모델명 **PascalCase 단수형**, 필드명 **camelCase**
- 스키마 변경 후 반드시 `pnpm prisma generate`

### Zod 검증

**신뢰 경계를 넘는 곳에서만 검증한다.**

| 상황 | 검증 |
|------|------|
| 외부 API 응답 | 필수 |
| Server Action 입력(FormData) | 필수 |
| `searchParams` | 필수 |
| DB → 서버 컴포넌트 (Prisma) | 불필요 |

- **`as` 단언 금지.** `safeParse` 후 실패 시 원본 에러는 `console.error`, 사용자에겐 일반화된 메시지
- `transform` 안에서 `throw` 금지 → `ctx.addIssue` + `return z.NEVER`
- 변환할 필드가 3개 이상이면 `.transform()`, 1~2개면 수동 함수가 더 명확하다
- 날짜 문자열은 타임존을 명시한다 — 안 박으면 서버(UTC)에서 하루 밀린다 (`"2026-01-31T00:00:00+09:00"`)
- 배열은 일부 항목만 실패해도 유효한 것만 살리되, 몇 개가 걸러졌는지 `console.warn`으로 남긴다
- Zod 검증 실패는 TanStack Query `retry`에서 제외한다 — 재시도해도 해결되지 않는다
- 스키마 위치: `src/lib/schemas/{domain}.ts` (입력/응답 같은 파일). 공유 값은 `schemas/common.ts`에 단일 정의
- **Zod 에러 메시지는 그대로 사용자에게 보인다** — 개발자 메모가 아니다
