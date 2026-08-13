import { CategoryChips } from "@/components/world/attraction/CategoryChips";
import { fetchAttractions } from "@/lib/overpass";
import type { LanguageCode } from "@/constants/languages";
import type { AttractionCategory, RegionBounds } from "@/types/attraction";

type AttractionFilterProps = {
  bounds: RegionBounds;
  language: LanguageCode;
};

/**
 * 분류별 개수를 세어 칩에 넘긴다.
 *
 * **개수는 거르기 전 목록에서 센다.** 걸러진 목록으로 세면 박물관을 고른
 * 순간 다른 칩의 숫자가 전부 0 이 되어 되돌아갈 곳을 잃는다.
 *
 * 목록·마커와 같은 조회를 타므로 요청이 늘지 않는다 — `fetchAttractions` 가
 * 한 요청 안에서 합쳐진다.
 */
export async function AttractionFilter({
  bounds,
  language,
}: AttractionFilterProps) {
  const { attractions } = await fetchAttractions(bounds, language);
  if (attractions.length === 0) return null;

  const tally = new Map<AttractionCategory, number>();
  for (const attraction of attractions) {
    tally.set(attraction.category, (tally.get(attraction.category) ?? 0) + 1);
  }

  const counts = [...tally]
    .map(([category, count]) => ({ category, count }))
    // 많은 것부터. 그 구역이 무엇으로 알려진 곳인지가 맨 앞에 온다.
    .sort((a, b) => b.count - a.count);

  return <CategoryChips counts={counts} total={attractions.length} />;
}
