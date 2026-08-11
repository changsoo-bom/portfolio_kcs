import type { Metadata } from "next";

import { PageHeader } from "@/components/common/PageHeader";
import { COPY, PROFILE } from "@/constants/profile";

export const metadata: Metadata = {
  title: "Contact",
  description: COPY.contact.lead,
};

/**
 * 연락 폼을 두지 않는다 — `mailto:`로 시작한다 (portfolio-기획 §결정해야 할 것).
 * 전화번호도 넣지 않는다. 크롤러가 수집한다 (자기소개 §7).
 */
const CHANNELS = [
  { label: "Email", value: PROFILE.email, href: `mailto:${PROFILE.email}` },
  { label: "GitHub", value: "changsoo-bom", href: PROFILE.github },
] as const;

export default function ContactPage() {
  return (
    <>
      <PageHeader
        no="06"
        label="Contact"
        title="연락처"
        lead={COPY.contact.lead}
      />

      <ul>
        {CHANNELS.map((c) => {
          const external = c.href.startsWith("http");

          return (
            <li key={c.label} className="border-b border-hairline">
              <a
                href={c.href}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="grid grid-cols-1 gap-2 py-8 transition-colors md:grid-cols-12 md:gap-6 hover:bg-surface-low"
              >
                <span className="label md:col-span-4">{c.label}</span>
                <span className="text-xl tracking-[-0.01em] text-ink md:col-span-8">
                  {c.value}
                  {external ? " ↗" : ""}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}
