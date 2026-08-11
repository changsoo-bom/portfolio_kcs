import { SectionHead } from "@/components/common/SectionHead";
import { CAREER, GROWTH } from "@/constants/experience";
import { COPY } from "@/constants/profile";

export function ExperienceSection() {
  return (
    <section id="experience" className="scroll-mt-24 pt-32 pb-24 md:pt-40">
      <SectionHead
        no="02"
        label="Experience"
        title="퍼블리싱에서 시스템까지"
        lead={COPY.experience.lead}
      />

      {/*
        성장 축. 스크롤이 이 구간을 지나는 동안 축이 화면에 붙어 있고
        오른쪽 경력이 흘러간다 — bpco의 pin 효과를 position: sticky로 낸다.
      */}
      <div className="grid grid-cols-1 gap-6 pt-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <ol className="md:sticky md:top-32">
            {GROWTH.map((stage, i) => (
              <li key={stage} className="reveal flex items-baseline gap-4">
                <span className="font-mono text-xs text-label">0{i + 1}</span>
                <span className="text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-[1.3] tracking-[-0.02em] text-ink">
                  {stage}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="md:col-span-7">
          {CAREER.map((c) => (
            <div
              key={c.company}
              className="reveal pb-12 mb-12 border-b border-hairline last:mb-0 last:border-b-0"
            >
              <p className="font-mono text-3xl text-ink">{c.year}</p>

              <h3 className="mt-4 text-2xl font-medium tracking-[-0.01em] text-ink">
                {c.company}
              </h3>
              <p className="mt-1 text-[15px] text-label">{c.team}</p>

              <p className="mt-6 font-mono text-sm leading-[1.6] text-muted">
                {c.stack}
              </p>
              <p className="max-w-[520px] mt-2 text-[15px] leading-[1.7] text-muted">
                {c.work}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
