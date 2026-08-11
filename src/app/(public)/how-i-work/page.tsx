import type { Metadata } from "next";

import { PageHeader } from "@/components/common/PageHeader";
import { AI_WORKFLOW, BUILD_PROCESS } from "@/constants/experience";
import { COPY } from "@/constants/profile";

export const metadata: Metadata = {
  title: "How I Work",
  description: COPY.howIWork.intro[0],
};

export default function HowIWorkPage() {
  return (
    <>
      <PageHeader
        no="05"
        label="How I Work"
        title="AI를 개발 과정에 어떻게 배치하는가"
        lead="I don't ask AI to build everything. I design the workflow around it."
      />

      <section className="py-16 border-b border-hairline">
        {COPY.howIWork.intro.map((p) => (
          <p
            key={p}
            className="max-w-[600px] mb-6 text-lg leading-[1.6] text-muted last:mb-0"
          >
            {p}
          </p>
        ))}
      </section>

      {/* 실제로 쓰는 도구만 적는다 — 03_AI/AI-Workflow.md */}
      <section className="py-16 border-b border-hairline">
        <h2 className="label">Workflow</h2>

        <ol className="mt-8">
          {AI_WORKFLOW.map((s) => (
            <li
              key={s.no}
              className="grid grid-cols-1 gap-2 py-6 border-t border-hairline md:grid-cols-12 md:gap-6"
            >
              <div className="flex items-baseline gap-4 md:col-span-4">
                <span className="label">{s.no}</span>
                <span className="text-xl font-medium tracking-[-0.01em] text-ink">
                  {s.stage}
                </span>
              </div>
              <div className="md:col-span-3">
                <span className="font-mono text-sm text-ink">{s.tool}</span>
              </div>
              <p className="text-[15px] leading-[1.6] text-muted md:col-span-5">
                {s.purpose}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="py-16 border-b border-hairline">
        <h2 className="label">Build Process</h2>

        <ol className="flex flex-wrap gap-x-3 gap-y-2 mt-8">
          {BUILD_PROCESS.map((step, i) => (
            <li key={step} className="flex items-center gap-3">
              {/* AI GENERATION 이후 세 단계가 이 프로세스의 핵심이다 */}
              <span
                className={
                  i >= 4 && i <= 6
                    ? "font-mono text-sm tracking-wider text-ink"
                    : "font-mono text-sm tracking-wider text-label"
                }
              >
                {step}
              </span>
              {i < BUILD_PROCESS.length - 1 ? (
                <span aria-hidden="true" className="text-label">
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="py-16">
        <h2 className="label">Principle</h2>

        <p className="max-w-[600px] mt-8 text-2xl font-medium leading-[1.4] tracking-[-0.01em] text-ink">
          AI generates. I decide. I validate. I refine.
        </p>

        {COPY.howIWork.key.map((p) => (
          <p
            key={p}
            className="max-w-[600px] mt-6 text-[15px] leading-[1.6] text-muted"
          >
            {p}
          </p>
        ))}
      </section>
    </>
  );
}
