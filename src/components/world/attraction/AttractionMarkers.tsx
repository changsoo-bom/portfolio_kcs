import { AttractionMarkerLayer } from "@/components/world/attraction/AttractionMarkerLayer";
import { fetchAttractions } from "@/lib/overpass";
import type { LanguageCode } from "@/constants/languages";
import type { AttractionCategory, RegionBounds } from "@/types/attraction";

type AttractionMarkersProps = {
  bounds: RegionBounds;
  language: LanguageCode;
  /** 고른 분류. 지도의 점도 목록과 같이 걸러진다. */
  category: AttractionCategory | undefined;
};

/**
 * 지도에 찍을 점을 서버에서 골라 넘긴다. **목록과 같은 조회를 탄다** —
 * 같은 요청 안에서는 fetch 가 합쳐져서 호출이 늘지 않는다.
 *
 * 좌표와 이름만 남기고 깎아서 넘기는 게 이 컴포넌트의 일이다.
 * 마커에 안 쓰는 설명·주소·사진까지 실어 보낼 이유가 없다.
 */
export async function AttractionMarkers({
  bounds,
  language,
  category,
}: AttractionMarkersProps) {
  const result = await fetchAttractions(bounds, language);
  const attractions = category
    ? result.attractions.filter((item) => item.category === category)
    : result.attractions;

  return (
    <AttractionMarkerLayer
      points={attractions.map(({ id, name, lng, lat }) => ({
        id,
        name,
        lng,
        lat,
      }))}
    />
  );
}
