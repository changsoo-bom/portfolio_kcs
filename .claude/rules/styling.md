---
globs:
  - "src/**/*.css"
  - "src/**/*.tsx"
---
### Tailwind CSS v4

- **`tailwind.config.js`를 쓰지 않는다.** 전역 토큰은 `src/app/globals.css`의 `@theme inline`에 정의
- 커스텀 색상은 CSS 변수로 정의하고 `@theme inline`으로 등록

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

- 다크 모드는 `prefers-color-scheme` 기반(시스템 설정 연동), `dark:` 접두사 사용

### 클래스 작성 순서

**레이아웃 → 크기 → 간격 → 타이포그래피 → 색상 → 기타**

```tsx
className="flex items-center w-full h-12 px-5 text-base font-medium text-background bg-foreground rounded-full transition-colors"
```

순서가 정해져 있으면 긴 클래스 문자열에서 원하는 걸 눈으로 빨리 찾는다.

### Sass 미사용

**Tailwind 전용.** `.scss` 파일이나 `styles/` 디렉터리를 두지 않는다.

폰트는 `next/font`로 로드하고 CSS 변수로 노출해 `@theme inline`에서 참조한다. 별도 `@font-face` 금지.
