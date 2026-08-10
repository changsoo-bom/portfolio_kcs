---
globs:
  - "src/**"
---
### 폴더 구조

레이어를 세로로 통과한다. **각 단계는 아래 단계만 알고, 위 단계는 모른다.**
이 방향이 뒤집히면 순환 의존이 생긴다.

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
│   ├── _components/          # 라우트 전용 프로바이더/셸 (query-provider 등)
│   └── api/                  # Route Handler — 라이브러리가 요구할 때만
│
├── components/
│   ├── ui/                   # 전역 프리미티브 (Button, Pagination…)
│   ├── common/               # 공통 조합 컴포넌트 (index.ts 배럴)
│   └── {domain}/{feature}/   # 도메인 컴포넌트
│
├── hooks/                    # use-*.ts 클라이언트 훅
├── lib/                      # 외부 API 클라이언트, schemas/, prisma.ts, utils.ts, 스토어
├── types/                    # {domain}.ts
└── constants/
```

원칙:
1. **`app/`은 라우팅만.** 로직은 컴포넌트·액션·lib에 있다.
2. **외부 API는 `lib/` 경유.** 컴포넌트에서 직접 fetch 하지 않는다.
3. 파일이 많아져도 **도메인 → 기능 2단계**로 접힌다.

라우트 그룹(`(public)` / `(auth)`)은 URL에 안 나타나면서 레이아웃과 접근 성격을 나눈다.

### 컴포넌트 조직

경로: `src/components/{도메인}/{기능}/{PascalCase}.tsx`
예) `src/components/project/list/ProjectList.tsx`

역할별 접미사로 쪼갠다 — 한 페이지를 통짜 컴포넌트로 만들지 않는다.

| 접미사 | 역할 | 예시 |
|--------|------|------|
| `List` | 목록/그리드 | `ProjectList.tsx` |
| `Filter` | 검색·필터 | `ProjectFilter.tsx` |
| `Card` | 목록의 한 항목 | `ProjectCard.tsx` |
| `Detail` | 상세 조회 | `ProjectDetail.tsx` |
| `Form` | 생성/편집 폼 | `ContactForm.tsx` |
| `Pop` | 팝업/모달 | `ImagePop.tsx` |

- `components/ui/` — 전역 프리미티브. **도메인 전용 컴포넌트를 절대 두지 않는다** (두면 잡동사니 서랍이 된다)
- `components/common/` — 여러 도메인이 공유하는 조합 컴포넌트, `index.ts` 배럴로 import
- **파일 하나 = 역할 하나**, `page.tsx`는 조립만
