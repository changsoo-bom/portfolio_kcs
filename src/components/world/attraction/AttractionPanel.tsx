import { AttractionCard } from "@/components/world/attraction/AttractionCard";
import { fetchAttractions } from "@/lib/overpass";
import type { LanguageCode } from "@/constants/languages";
import type { RegionBounds } from "@/types/attraction";

type AttractionPanelProps = {
  bounds: RegionBounds;
  language: LanguageCode;
  /** 카드 링크가 얹힐 지금의 파라미터(region·lang). */
  query: string;
};

/**
 * 패널에 깔리는 목록. **서버 컴포넌트다.**
 *
 * Overpass 는 공용 무료 서버라 호출량 제한이 있는데, 서버에서 부르고 캐시하면
 * 구역당 하루 한 번으로 줄어든다. 클라이언트에서 부르면 방문자 수만큼 나간다.
 * 밀집한 구역은 응답이 10초를 넘기도 해서, 캐시가 성능 대책이기도 하다.
 */
export async function AttractionPanel({
  bounds,
  language,
  query,
}: AttractionPanelProps) {
  const { status, attractions } = await fetchAttractions(bounds, language);

  if (attractions.length === 0) {
    return (
      <p className="px-5 py-10 text-sm leading-relaxed text-white/40">
        {status === "unavailable"
          ? "지금은 명소를 불러오지 못했다. 잠시 뒤에 다시 눌러보자."
          : "이 구역에서 찾은 명소가 없다."}
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 px-4 pt-4 pb-8">
      {attractions.map((attraction) => (
        <li key={attraction.id}>
          <AttractionCard attraction={attraction} query={query} />
        </li>
      ))}
    </ul>
  );
}
