---
globs:
  - "src/**/*.tsx"
  - "src/lib/**"
  - "src/hooks/**"
---
### 데이터 종류마다 사는 곳이 다르다

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

#### Zustand — 클라이언트 UI 상태만

- 파일명 `use-{domain}-store.ts`, 스토어명 `use{Domain}Store`
- 인터페이스를 먼저 정의하고 `create<T>()` 제네릭 사용
- **서버 데이터를 Zustand에 복사하지 않는다.** 언제 갱신할지·무엇이 최신인지를 손으로 관리하게 되는 동기화 지옥의 원인이다

#### TanStack Query — 쓰는 자리가 좁다

- **무한스크롤 등 클라이언트에서 이어붙이는 페칭에만.** 초기 렌더 데이터는 서버 컴포넌트가 준다
- 폼 상태를 위해 mutation을 쓰지 않는다 — 그건 Server Action의 일이다
- 기본 `staleTime` 60초
- query key는 배열 네임스페이스(`["projects", params]`), **응답을 가르는 값(필터·정렬)은 반드시 키에 포함** — 누락 시 캐시 오염

> Zustand·TanStack Query·Zod·Prisma는 아직 설치돼 있지 않다. 위 판단 흐름에서 실제로 필요해진 시점에 추가한다.
