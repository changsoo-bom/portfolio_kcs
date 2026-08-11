import { SectionHead } from "@/components/common/SectionHead";
import { COPY } from "@/constants/profile";
import { TECH_STACK } from "@/constants/tech";

export function TechSection() {
  return (
    <section id="tech" className="scroll-mt-24 pt-32 pb-24 md:pt-40">
      <SectionHead no="04" label="Tech" title="기술 스택" lead={COPY.tech.lead} />

      {/* 숙련도 별점·퍼센트 바를 쓰지 않는다 — 어디에 왜 썼는지로 대신한다 */}
      <dl className="pt-8">
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
            <dd className="max-w-[600px] text-[15px] leading-[1.7] text-muted md:col-span-8">
              {t.copy}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
