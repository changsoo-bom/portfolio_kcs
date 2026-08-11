import Link from "next/link";

import { PROFILE } from "@/constants/profile";

export default function Home() {
  return (
    <>
      {/*
        인트로 커버. 히어로를 덮는 오버레이라 히어로 마크업은 처음부터 DOM에 있다
        — LCP와 크롤러에 영향이 없다. 재생 여부는 CSS가 판단한다(globals.css).
      */}
      <div
        aria-hidden="true"
        className="intro-cover fixed inset-0 z-50 flex items-center justify-center bg-surface"
      >
        <p className="text-3xl font-semibold text-ink sm:text-5xl">
          {PROFILE.name}
        </p>
      </div>

      <main className="flex flex-col flex-1 justify-center w-full max-w-[1280px] mx-auto px-5 pt-28 pb-16 sm:px-8 lg:px-16">
        {/* .rise는 :nth-child로 딜레이를 준다 — 순서를 바꾸면 타이밍도 바뀐다 */}
        <p className="rise label">{PROFILE.concept}</p>

        <h1 className="rise mt-6 text-[clamp(2.5rem,9vw,5rem)] font-bold leading-[1.1] tracking-[-0.04em] text-ink">
          {PROFILE.name}
        </h1>

        <p className="rise mt-6 max-w-[600px] text-lg leading-[1.6] text-muted">
          {PROFILE.role}. {PROFILE.tagline}
        </p>

        <div className="rise mt-16 pt-6 border-t border-divider">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="label">Currently Exploring</p>
              <p className="mt-2 text-lg text-ink">
                Next.js · React 19 · TypeScript · AI-assisted Development
              </p>
            </div>

            <Link
              href="/about"
              className="inline-flex items-center self-start h-12 px-6 font-mono text-sm tracking-wider uppercase text-surface bg-ink rounded-sm transition-colors hover:bg-accent md:self-auto"
            >
              소개 보기
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
