import type { Metadata } from "next";

import { PageHeader } from "@/components/common/PageHeader";
import { CAREER, GROWTH } from "@/constants/experience";
import { COPY } from "@/constants/profile";

export const metadata: Metadata = {
  title: "Experience",
  description: COPY.experience.lead,
};

export default function ExperiencePage() {
  return (
    <>
      <PageHeader
        no="02"
        label="Experience"
        title="경력"
        lead={COPY.experience.lead}
      />

      {/* 성장 축 — Philosophy의 4단계와 같다 */}
      <section className="py-12 border-b border-hairline">
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {GROWTH.map((stage, i) => (
            <li key={stage} className="flex items-center gap-3">
              <span className="font-mono text-sm tracking-widest text-ink">
                {stage}
              </span>
              {i < GROWTH.length - 1 ? (
                <span aria-hidden="true" className="text-label">
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {CAREER.map((c) => (
        <section
          key={c.company}
          className="reveal grid grid-cols-1 gap-6 py-12 border-b border-hairline md:grid-cols-12"
        >
          <div className="md:col-span-3">
            <p className="font-mono text-2xl text-ink">{c.year}</p>
          </div>

          <div className="md:col-span-9">
            <h2 className="text-2xl font-medium tracking-[-0.01em] text-ink">
              {c.company}
            </h2>
            <p className="mt-1 text-[15px] text-label">{c.team}</p>

            <p className="mt-6 font-mono text-sm text-muted">{c.stack}</p>
            <p className="max-w-[600px] mt-2 text-[15px] leading-[1.6] text-muted">
              {c.work}
            </p>
          </div>
        </section>
      ))}
    </>
  );
}
