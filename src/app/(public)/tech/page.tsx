import type { Metadata } from "next";

import { PageHeader } from "@/components/common/PageHeader";
import { COPY } from "@/constants/profile";
import { TECH_STACK } from "@/constants/tech";

export const metadata: Metadata = {
  title: "Tech Stack",
  description: COPY.tech.lead,
};

export default function TechPage() {
  return (
    <>
      <PageHeader
        no="04"
        label="Tech Stack"
        title="기술 스택"
        lead={COPY.tech.lead}
      />

      <dl>
        {TECH_STACK.map((t, i) => (
          <div
            key={t.name}
            className="reveal row-hover group grid grid-cols-1 gap-4 py-8 border-b border-hairline md:grid-cols-12 md:gap-6"
          >
            <dt className="md:col-span-4">
              <span className="label transition-colors group-hover:text-ink">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="block mt-2 text-xl font-medium tracking-[-0.01em] text-ink">
                {t.name}
              </span>
            </dt>
            <dd className="max-w-[600px] text-[15px] leading-[1.6] text-muted md:col-span-8">
              {t.copy}
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}
