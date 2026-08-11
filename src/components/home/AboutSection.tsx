import { SectionHead } from "@/components/common/SectionHead";
import { COPY } from "@/constants/profile";

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24 pt-32 pb-24 md:pt-40">
      <SectionHead
        no="01"
        label="About"
        title="어떤 개발자인가"
        lead={COPY.about.intro[0]}
      />

      <div className="grid grid-cols-1 gap-6 pt-16 md:grid-cols-12">
        <div className="md:col-span-4" />
        <div className="md:col-span-8">
          {COPY.about.intro.slice(1).map((p) => (
            <p
              key={p}
              className="reveal max-w-[600px] mb-8 text-lg leading-[1.7] text-muted last:mb-0"
            >
              {p}
            </p>
          ))}
        </div>
      </div>

      {[COPY.about.strength, COPY.about.weakness].map((block, i) => (
        <div
          key={block.lead}
          className="reveal grid grid-cols-1 gap-6 pt-20 md:grid-cols-12"
        >
          <p className="label md:col-span-4">{i === 0 ? "강점" : "약점"}</p>

          <div className="md:col-span-8">
            <p className="max-w-[600px] text-2xl font-medium leading-[1.4] tracking-[-0.01em] text-ink">
              {block.lead}
            </p>
            {block.body.map((p) => (
              <p
                key={p}
                className="max-w-[600px] mt-6 text-[15px] leading-[1.7] text-muted"
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
