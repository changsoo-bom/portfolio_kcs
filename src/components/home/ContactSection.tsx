import { SectionHead } from "@/components/common/SectionHead";
import { COPY, PROFILE } from "@/constants/profile";

/**
 * 연락 폼을 두지 않는다 — `mailto:`로 시작한다 (portfolio-기획 §결정해야 할 것).
 * 전화번호도 넣지 않는다. 크롤러가 수집한다 (자기소개 §7).
 */
const CHANNELS = [
  { label: "Email", value: PROFILE.email, href: `mailto:${PROFILE.email}` },
  { label: "GitHub", value: "changsoo-bom", href: PROFILE.github },
] as const;

export function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-24 pt-32 pb-40 md:pt-40">
      <SectionHead
        no="05"
        label="Contact"
        title="연락처"
        lead={COPY.contact.lead}
      />

      <ul className="pt-8">
        {CHANNELS.map((c) => {
          const external = c.href.startsWith("http");

          return (
            <li key={c.label} className="reveal border-b border-hairline">
              <a
                href={c.href}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="row-hover group grid grid-cols-1 gap-2 py-8 md:grid-cols-12 md:gap-6"
              >
                <span className="label md:col-span-4 transition-colors group-hover:text-ink">
                  {c.label}
                </span>
                <span className="text-xl tracking-[-0.01em] text-ink md:col-span-8">
                  <span className="underline-grow">{c.value}</span>
                  {external ? (
                    <span className="inline-block ml-1 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                      ↗
                    </span>
                  ) : null}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
