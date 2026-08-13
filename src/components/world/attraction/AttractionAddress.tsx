import { DetailRow } from "@/components/world/attraction/DetailRow";
import { messagesOf } from "@/constants/messages";
import { fetchAddress } from "@/lib/nominatim";
import type { LanguageCode } from "@/constants/languages";

type AttractionAddressProps = {
  lat: number;
  lng: number;
  language: LanguageCode;
};

/**
 * 좌표로 짚은 주소. **혼자 흘러간다.**
 *
 * 상세의 나머지는 이미 받아 둔 목록에서 나와 곧바로 뜨는데, 이것만 바깥
 * 서버를 한 번 더 탄다. 같이 묶으면 카드를 눌러도 모달이 안 열린 것처럼 보인다.
 *
 * 못 짚으면 줄을 통째로 지운다 — 빈 주소 칸은 없느니만 못하다.
 */
export async function AttractionAddress({
  lat,
  lng,
  language,
}: AttractionAddressProps) {
  const address = await fetchAddress(lat, lng, language);
  if (!address) return null;

  return <DetailRow label={messagesOf(language).address}>{address}</DetailRow>;
}
