import type { ReactNode } from "react";

/** 상세의 한 줄. 이름표 폭을 고정해 값들이 세로로 맞는다. */
export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-4 py-2.5 border-t border-white/5">
      <dt className="shrink-0 w-16 text-xs text-white/35">{label}</dt>
      <dd className="min-w-0 text-sm break-words text-white/80">{children}</dd>
    </div>
  );
}
