import { nominatimReverseSchema } from "@/lib/schemas/attraction";
import type { LanguageCode } from "@/constants/languages";

/**
 * 좌표 → 주소(역지오코딩). OpenStreetMap 의 Nominatim 을 쓴다.
 *
 * OSM 명소의 상당수는 `addr:*` 태그가 비어 있어서 화면에 좌표만 남는다.
 * 좌표는 정확하지만 어디인지 읽히지 않아서, 태그가 없을 때만 여기로 떨어진다.
 *
 * **공용 무료 서버라 지켜야 할 선이 있다** — 초당 1건, 대량 변환 금지,
 * 신원을 밝히는 User-Agent. 서버에서만 부르고, 상세를 연 장소 하나에 대해서만,
 * 그것도 캐시를 태워서 부른다. 목록 120건을 통째로 변환하는 짓은 하지 않는다.
 */
const ENDPOINT = "https://nominatim.openstreetmap.org/reverse";

/** 주소는 명소 목록보다도 덜 바뀐다. 한 달을 잡는다. */
const REVALIDATE = 60 * 60 * 24 * 30;

const USER_AGENT = "world-atlas (https://github.com/changsoo-bom/portfolio_kcs)";

/**
 * 건물 단위. 더 올리면 개별 주소가 안 나오고, 더 내리면 도로까지만 나온다.
 */
const ZOOM = 18;

/**
 * 큰 단위부터 이어 붙일 순서. 한 칸에 여러 후보를 둔 건 나라마다 쓰는 이름이
 * 다르기 때문이다.
 *
 * 실제 응답을 보고 칸을 갈랐다. 양구백자박물관은 `county`(양구군)·`town`(방산면)·
 * `village`(장평리)가 **셋 다** 오는데 한 칸에 몰면 하나만 남아 주소가 끊긴다.
 *
 * 나라는 뺐다 — 이미 그 구역을 보고 있는 화면이라 "대한민국"이 앞에 붙어야
 * 알게 되는 게 없다.
 */
const PARTS = [
  ["state", "province", "region"],
  ["state_district", "county"],
  ["city", "municipality"],
  ["town"],
  ["village", "hamlet"],
  ["city_district", "borough", "district"],
  ["suburb", "quarter", "neighbourhood"],
  ["road"],
  ["house_number"],
] as const;

function composeAddress(address: Record<string, string>) {
  const parts: string[] = [];
  const used = new Set<string>();

  for (const candidates of PARTS) {
    /**
     * 이미 쓴 이름은 건너뛰고 **다음 후보를 본다.** 파리는 `city` 와
     * `city_district` 가 둘 다 "파리"라, 걸러내고 멈추면 그 아래 "파리 7구"까지
     * 같이 잃는다.
     */
    const value = candidates
      .map((key) => address[key])
      .find((candidate) => candidate && !used.has(candidate));

    if (value) {
      used.add(value);
      parts.push(value);
    }
  }

  return parts.length > 0 ? parts.join(" ") : undefined;
}

/**
 * 좌표에 해당하는 주소. 못 짚으면 undefined 다 — 화면은 좌표만 남긴다.
 *
 * **실패해도 던지지 않는다.** 주소는 있으면 좋은 정보라, 이것 때문에 상세가
 * 통째로 안 뜨면 손해다.
 */
export async function fetchAddress(
  lat: number,
  lng: number,
  language: LanguageCode,
): Promise<string | undefined> {
  const url =
    `${ENDPOINT}?format=jsonv2&zoom=${ZOOM}` +
    `&lat=${lat}&lon=${lng}&accept-language=${language}`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: REVALIDATE },
    });
    if (!response.ok) {
      console.warn("[nominatim]", response.status, response.statusText);
      return undefined;
    }

    const parsed = nominatimReverseSchema.safeParse(await response.json());
    if (!parsed.success) {
      console.warn("[nominatim] 응답 모양이 다르다", parsed.error);
      return undefined;
    }

    return parsed.data.address
      ? composeAddress(parsed.data.address)
      : undefined;
  } catch (error) {
    console.warn("[nominatim]", error);
    return undefined;
  }
}
