/**
 * 페이지 상단 — 계측 라벨 + 큰 제목 + 리드 문장.
 * 섹션 번호를 모노 라벨로 붙이는 게 이 디자인의 기본 골격이다 (design-reference §Components).
 */
type PageHeaderProps = {
  /** 버거 메뉴와 같은 번호 — "01" */
  no: string;
  label: string;
  title: string;
  lead?: string;
};

export function PageHeader({ no, label, title, lead }: PageHeaderProps) {
  return (
    <header className="pt-8 pb-12 border-b border-divider">
      <p className="label">
        {no} — {label}
      </p>

      <h1 className="mt-6 text-[clamp(2rem,7vw,3rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-ink">
        {title}
      </h1>

      {lead ? (
        <p className="mt-6 max-w-[600px] text-lg leading-[1.6] text-muted">
          {lead}
        </p>
      ) : null}
    </header>
  );
}
