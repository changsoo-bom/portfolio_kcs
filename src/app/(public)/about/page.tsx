import type { Metadata } from "next";

import { PageHeader } from "@/components/common/PageHeader";
import { COPY } from "@/constants/profile";

export const metadata: Metadata = {
  title: "About",
  description: COPY.about.intro[0],
};

/** 좌측 sticky 라벨 + 우측 본문. design-reference §Sticky Section Label */
function Section({
  no,
  label,
  children,
}: {
  no: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 gap-6 py-16 border-b border-hairline md:grid-cols-12">
      <div className="md:col-span-4">
        <h2 className="label md:sticky md:top-28">
          {no} {label}
        </h2>
      </div>
      <div className="md:col-span-8">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <>
      <PageHeader
        no="01"
        label="About"
        title="어떤 개발자인가"
        lead={COPY.about.intro[0]}
      />

      <Section no="01." label="Intro">
        {COPY.about.intro.slice(1).map((p) => (
          <p
            key={p}
            className="max-w-[600px] mb-6 text-lg leading-[1.6] text-muted last:mb-0"
          >
            {p}
          </p>
        ))}
      </Section>

      <Section no="02." label="Strength">
        <p className="max-w-[600px] text-2xl font-medium leading-[1.4] tracking-[-0.01em] text-ink">
          {COPY.about.strength.lead}
        </p>
        {COPY.about.strength.body.map((p) => (
          <p
            key={p}
            className="max-w-[600px] mt-6 text-[15px] leading-[1.6] text-muted"
          >
            {p}
          </p>
        ))}
      </Section>

      <Section no="03." label="Weakness">
        <p className="max-w-[600px] text-2xl font-medium leading-[1.4] tracking-[-0.01em] text-ink">
          {COPY.about.weakness.lead}
        </p>
        {COPY.about.weakness.body.map((p) => (
          <p
            key={p}
            className="max-w-[600px] mt-6 text-[15px] leading-[1.6] text-muted"
          >
            {p}
          </p>
        ))}
      </Section>
    </>
  );
}
