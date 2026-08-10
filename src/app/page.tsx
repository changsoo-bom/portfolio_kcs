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
        className="intro-cover fixed inset-0 z-50 flex items-center justify-center bg-abyss"
      >
        <p className="text-3xl font-medium text-white sm:text-5xl">
          {PROFILE.name}
        </p>
      </div>

      <main className="flex flex-col flex-1 justify-center w-full max-w-[1440px] mx-auto px-5 pt-20 pb-16 sm:px-8 lg:px-12">
        <p className="rise text-[10px] uppercase tracking-[0.15em] text-silver">
          Portfolio
        </p>

        <h1 className="rise mt-6 text-[clamp(2.5rem,8vw,3.8rem)] font-medium leading-none tracking-[-0.04em] text-white">
          {PROFILE.name}
        </h1>

        <p className="rise mt-5 max-w-[600px] text-base leading-[1.4] text-silver">
          {PROFILE.role} — {PROFILE.tagline}
        </p>

        <div className="rise mt-10">
          <Link
            href="/about"
            className="btn-aurora inline-flex items-center h-12 px-6 text-sm uppercase tracking-[0.08em] text-[#222222] rounded-md"
          >
            소개 보기
          </Link>
        </div>
      </main>
    </>
  );
}
