/**
 * 원페이지 섹션의 머리. 좌측에 번호 라벨, 우측에 제목이 온다.
 *
 * `PageHeader`와 따로 두는 이유 — 저쪽은 페이지 최상단 `h1`이고
 * 이쪽은 한 페이지 안에 여섯 번 반복되는 `h2`다.
 */
type SectionHeadProps = {
  no: string;
  label: string;
  title: string;
  lead?: string;
};

export function SectionHead({ no, label, title, lead }: SectionHeadProps) {
  return (
    <div className="reveal grid grid-cols-1 gap-6 pb-12 border-b border-divider md:grid-cols-12">
      <p className="label md:col-span-4">
        {no} — {label}
      </p>

      <div className="md:col-span-8">
        <h2 className="text-[clamp(1.75rem,5vw,2.75rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-ink">
          {title}
        </h2>
        {lead ? (
          <p className="max-w-[600px] mt-5 text-lg leading-[1.6] text-muted">
            {lead}
          </p>
        ) : null}
      </div>
    </div>
  );
}
