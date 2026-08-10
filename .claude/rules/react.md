---
globs:
  - "src/app/**/*.tsx"
  - "src/components/**/*.tsx"
  - "src/hooks/**/*.ts"
---
### 컴포넌트 경계

- 기본은 **서버 컴포넌트**. `"use client"`는 **실제로 상호작용하는 말단(leaf)에만** (입력, 폼, 모달)
- 페이지·레이아웃·목록 컨테이너는 서버 컴포넌트로 유지
- 목록을 통째로 클라이언트 컴포넌트로 만들면 SEO와 초기 로딩을 통째로 버린다. **공개 페이지에서는 치명적이다.**

### React 19 패턴

- **`forwardRef` 사용하지 않는다.** ref를 일반 prop으로 받는다 — `function InputBox({ ref, ...props })`
- Server → Client로 Promise를 넘길 때는 `use(promise)` + `<Suspense>` (초기 렌더 데이터는 서버에서 직접 await)
- ref 콜백에서 cleanup 함수를 반환하면 언마운트 시 자동 정리 (IntersectionObserver, 이벤트 리스너 등)
- Server Action과 짝지어 즉각 피드백이 필요하면 `useOptimistic` (실패 시 자동 롤백)
- 이미지는 `next/image`. 외부 호스트는 `next.config.ts`의 `images.remotePatterns`에 등록
- 그 외 리소스 프리로드는 `react-dom`의 `preload()` (웹폰트는 `next/font`가 자동 처리)

### React Compiler 규칙

`next.config.ts`에 `reactCompiler: true`. `eslint-plugin-react-hooks` v7의 Compiler 전용 규칙이 적용된다.

- **`set-state-in-effect`** — `useEffect` 안에서 `setState` 금지
  - 읽기 전용 데이터 → state 대신 **파생 값으로 직접 계산** (`const value = data?.name ?? ""`)
  - 로컬 편집 state가 필요하면 부모에서 **`key` prop으로 리마운트** 제어
- **`set-state-in-render`** — 렌더링 중 `setState` 금지
- 기타: `purity`, `immutability`, `refs`, `globals`, `use-memo`, `static-components`

**`eslint-disable`로 덮지 않는다.** Compiler는 규칙 준수를 전제로 메모이제이션을 넣기 때문에,
덮어두면 잘못된 전제로 최적화하고 증상은 엉뚱한 곳에서 나타난다. 린트 에러 지점이 고칠 지점이다.
