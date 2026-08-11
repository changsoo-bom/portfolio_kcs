/**
 * 공개 페이지 공통 컨테이너.
 * `pt-20`은 고정 헤더(h-20) 높이를 피하는 값이다 — layout.tsx와 함께 바꾼다.
 */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="w-full max-w-[1280px] mx-auto px-5 pt-20 pb-32 sm:px-8 lg:px-16">
      {children}
    </main>
  );
}
