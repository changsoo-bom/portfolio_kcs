import { AttractionPanelShell } from "@/components/world/attraction/AttractionPanelShell";

/** 기다리는 동안 채워 둘 카드 수. 화면을 한 번 덮을 만큼이면 된다. */
const PLACEHOLDERS = Array.from({ length: 8 }, (_, index) => index);

/**
 * 기다리는 화면.
 *
 * **구역 이름은 이때 이미 안다** — 이름은 번들에 들어 있는 표를 조회한 값이고,
 * 시간이 걸리는 건 명소 조회뿐이다. 그래서 제목을 먼저 띄운다. 밀집한 구역은
 * Overpass 응답이 10초를 넘기도 해서, 이게 없으면 클릭이 씹힌 것처럼 보인다.
 */
export function AttractionPanelSkeleton({ title }: { title: string }) {
  return (
    <AttractionPanelShell title={title}>
      <ul className="grid grid-cols-2 gap-3 px-4 pt-4 pb-8">
        {PLACEHOLDERS.map((index) => (
          <li key={index}>
            <div className="overflow-hidden rounded-xl bg-white/5">
              <div className="aspect-4/3 w-full animate-pulse bg-white/5" />
              <div className="px-2.5 py-2">
                <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
                <div className="mt-2 h-2 w-1/3 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </AttractionPanelShell>
  );
}
