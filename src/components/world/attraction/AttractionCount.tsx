import { messagesOf } from "@/constants/messages";
import { fetchAttractions } from "@/lib/overpass";
import type { LanguageCode } from "@/constants/languages";
import type { RegionBounds } from "@/types/attraction";

type AttractionCountProps = {
  bounds: RegionBounds;
  language: LanguageCode;
};

/**
 * 제목 아래 한 줄. **목록과 같은 조회를 탄다.**
 *
 * 제목은 바로 나오고 개수는 늦게 나오는데, 둘이 같은 기다림에 묶여 있으면
 * 아는 것까지 늦게 보인다. 그래서 개수만 따로 떼어 흘려보낸다.
 * 같은 요청 안에서는 fetch 가 합쳐져서 호출이 늘지 않는다.
 */
export async function AttractionCount({
  bounds,
  language,
}: AttractionCountProps) {
  const { attractions } = await fetchAttractions(bounds, language);
  return messagesOf(language).places(attractions.length);
}
