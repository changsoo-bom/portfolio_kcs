import { AttractionCard } from "@/components/world/attraction/AttractionCard";
import { messagesOf } from "@/constants/messages";
import { fetchAttractions } from "@/lib/overpass";
import type { LanguageCode } from "@/constants/languages";
import type { AttractionCategory, RegionBounds } from "@/types/attraction";

type AttractionPanelProps = {
  bounds: RegionBounds;
  language: LanguageCode;
  /** 고른 분류. 없으면 전부 보여준다. */
  category: AttractionCategory | undefined;
  /** 카드 링크가 얹힐 지금의 파라미터(region·lang·category). */
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
  category,
  query,
}: AttractionPanelProps) {
  const result = await fetchAttractions(bounds, language);
  const { status } = result;
  const messages = messagesOf(language);

  // 거르는 건 여기서 한다 — 칩의 개수는 거르기 전 목록에서 세야 해서,
  // 조회 자체는 분류를 모르는 채로 둔다
  const attractions = category
    ? result.attractions.filter((item) => item.category === category)
    : result.attractions;

  if (attractions.length === 0) {
    return (
      <p className="px-5 py-10 text-sm leading-relaxed text-white/40">
        {status === "unavailable" ? messages.unavailable : messages.empty}
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 px-4 pt-4 pb-8">
      {attractions.map((attraction) => (
        <li key={attraction.id}>
          <AttractionCard
            attraction={attraction}
            query={query}
            language={language}
          />
        </li>
      ))}
    </ul>
  );
}
