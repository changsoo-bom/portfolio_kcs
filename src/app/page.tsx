import Link from "next/link";

import { IntroCover } from "@/app/_components/IntroCover";
import { AboutSection } from "@/components/home/AboutSection";
import { ContactSection } from "@/components/home/ContactSection";
import { ExperienceSection } from "@/components/home/ExperienceSection";
import { TechSection } from "@/components/home/TechSection";
import { WorkSection } from "@/components/home/WorkSection";
import { PROFILE } from "@/constants/profile";

/**
 * 원페이지. ABOUT·EXPERIENCE·WORK·TECH·CONTACT가 전부 여기 섹션으로 들어간다.
 * AI만 분량이 커서 `/how-i-work`로 따로 뺐다.
 */
export default function Home() {
  return (
    <>
      <IntroCover line={`${PROFILE.role}. ${PROFILE.tagline}`} />

      {/* 히어로 — 뷰포트를 채운다 */}
      <header className="flex flex-col justify-center w-full max-w-[1280px] min-h-dvh mx-auto px-5 pt-28 pb-24 sm:px-8 lg:px-16">
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

            <p
              aria-hidden="true"
              className="font-mono text-xs tracking-[0.2em] uppercase text-label"
            >
              Scroll ↓
            </p>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-16">
        <AboutSection />
        <ExperienceSection />
        <WorkSection />
        <TechSection />

        {/* AI 티저 — 본문은 /how-i-work에 있다 */}
        <section className="reveal py-32 border-y border-divider md:py-40">
          <p className="label">AI-Assisted Development</p>

          <p className="max-w-[720px] mt-8 text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-[1.3] tracking-[-0.02em] text-ink">
            I don&apos;t ask AI to build everything.
            <br />I design the workflow around it.
          </p>

          <Link
            href="/how-i-work"
            className="group inline-flex items-center gap-2 mt-10 h-12 px-6 font-mono text-sm tracking-wider uppercase text-surface bg-ink rounded-sm transition-colors hover:bg-accent"
          >
            Workflow 보기
            <span
              aria-hidden="true"
              className="inline-block transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </section>

        <ContactSection />
      </main>
    </>
  );
}
