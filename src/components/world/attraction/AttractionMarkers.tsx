import { AttractionMarkerLayer } from "@/components/world/attraction/AttractionMarkerLayer";
import { fetchAttractions } from "@/lib/overpass";
import type { LanguageCode } from "@/constants/languages";
import type { RegionBounds } from "@/types/attraction";

type AttractionMarkersProps = {
  bounds: RegionBounds;
  language: LanguageCode;
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
}: AttractionMarkersProps) {
  const { attractions } = await fetchAttractions(bounds, language);

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
