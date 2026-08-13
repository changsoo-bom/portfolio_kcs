/** 기다리는 동안 채워 둘 카드 수. 화면을 한 번 덮을 만큼이면 된다. */
const PLACEHOLDERS = Array.from({ length: 8 }, (_, index) => index);

/**
 * 기다리는 목록.
 *
 * 밀집한 구역은 Overpass 응답이 10초를 넘기도 한다. 빈 패널만 떠 있으면
 * 클릭이 씹힌 것처럼 보여서, 올 모양을 미리 깔아 둔다.
 */
export function AttractionListSkeleton() {
  return (
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
  );
}
