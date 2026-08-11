import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";

import { SiteNav } from "@/app/_components/SiteNav";
import { PROFILE } from "@/constants/profile";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${PROFILE.name} — 포트폴리오`,
    template: `%s — ${PROFILE.name}`,
  },
  description: `${PROFILE.role}. ${PROFILE.tagline}`,
};

/**
 * 첫 방문이 아니면 `<html data-intro="seen">`을 붙여 인트로를 건너뛴다.
 * HTML 파싱 중 동기 실행되므로 첫 페인트 전에 반영된다 — 깜빡임도, 하이드레이션
 * 불일치도 없다. `useEffect`로 하면 커버가 한 번 보였다 사라진다.
 *
 * 개발 모드에서는 Strict Mode 리마운트가 `<html>` 속성을 초기화해서
 * 인트로가 다시 재생될 수 있다. 프로덕션 빌드에서는 발생하지 않는다.
 */
const INTRO_SKIP = `(function(){try{if(sessionStorage.getItem("intro"))document.documentElement.dataset.intro="seen";else sessionStorage.setItem("intro","1")}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_SKIP }} />
      </head>
      <body className="flex flex-col min-h-full bg-surface text-ink">
        {/* 헤어라인 + 블러. 배경이 비치되 본문과 경계는 남는다 */}
        <header className="fixed top-0 left-0 z-40 w-full border-b border-hairline bg-surface/80 backdrop-blur-md">
          <div className="flex items-center justify-between w-full max-w-[1280px] h-20 mx-auto px-5 sm:px-8 lg:px-16">
            <Link
              href="/"
              className="text-xl font-bold tracking-tighter text-ink"
            >
              {PROFILE.name}
            </Link>
            <SiteNav />
          </div>

          {/* 스크롤 진행 바. CSS scroll timeline이라 JS가 없다 */}
          <div
            aria-hidden="true"
            className="scroll-progress absolute bottom-0 left-0 w-full h-px bg-ink"
          />
        </header>
        {children}
      </body>
    </html>
  );
}
