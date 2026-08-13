import regionIndex from "@/data/region-index.json";
import {
  overpassElementSchema,
  overpassResponseSchema,
  wikidataEntitiesSchema,
} from "@/lib/schemas/attraction";
import { ATTRACTION_CATEGORIES } from "@/types/attraction";
import type {
  Attraction,
  AttractionCategory,
  AttractionResult,
  RegionBounds,
} from "@/types/attraction";
import type { LanguageCode } from "@/constants/languages";
import { FALLBACK_LANGUAGE } from "@/constants/languages";

const ENDPOINT = "https://overpass-api.de/api/interpreter";

/** 한 구역에서 가져올 최대 개수. 도(道) 단위면 이 정도로 화면이 충분히 찬다. */
const LIMIT = 120;

/**
 * 캐시 수명(초). OSM 명소는 하루 단위로 바뀌지 않는다.
 *
 * **Overpass 는 공용 무료 서버라 호출량 제한이 있다.** 클라이언트에서 직접
 * 부르면 방문자 수만큼 그대로 나가지만, 서버에서 부르고 캐시하면 구역당 하루
 * 한 번으로 줄어든다. 이 기능을 서버 컴포넌트로 만든 실질적인 이유다.
 */
const REVALIDATE = 60 * 60 * 24;

/** 공용 서버 예의 — 어디서 오는 요청인지 밝힌다. */
const USER_AGENT = "world-atlas (https://github.com/changsoo-bom/portfolio_kcs)";

/**
 * 429 는 "지금 빈 슬롯이 없다" 는 뜻이라 잠깐 뒤에 다시 물으면 대개 통한다.
 * 미러(kumi·private.coffee·osm.jp)도 재보았지만 타임아웃·504 라 폴백이 못 된다.
 */
const RETRY_DELAY = 1500;

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Commons 파일 이름을 그대로 이미지 주소로 바꾼다. API 호출이 필요 없다. */
function commonsImage(file: string) {
  const name = file.replace(/^File:/, "").trim();
  if (!name) return undefined;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=640`;
}

const CATEGORIES: ReadonlySet<string> = new Set(ATTRACTION_CATEGORIES);

type RegionEntry = { bbox: number[]; names: Record<string, string> };

/** 생성된 JSON 이라 리터럴 타입이 붙는다. 여기서 한 번만 넓혀 쓴다. */
const REGIONS: Record<string, RegionEntry> = regionIndex;

/**
 * 구역 정보. 없는 id 면 null 이다 — 주소창을 손으로 고친 경우까지 여기서 막힌다.
 * 이 파일은 서버에서만 읽는다(1.3MB). 클라이언트 번들에 들어가지 않게 주의할 것.
 */
export function regionEntryOf(
  region: string,
  language: LanguageCode,
): { bounds: RegionBounds; name: string } | null {
  const entry = REGIONS[region];
  if (!entry || entry.bbox.length !== 4) return null;

  const [west, south, east, north] = entry.bbox;
  const { names } = entry;

  return {
    bounds: { west, south, east, north },
    name: names[language] ?? names[FALLBACK_LANGUAGE] ?? names.local ?? region,
  };
}

/** Overpass 의 상자 순서는 (남, 서, 북, 동) 이다 — 흔히 쓰는 순서와 다르다. */
function buildQuery({ west, south, east, north }: RegionBounds) {
  const box = `${south},${west},${north},${east}`;
  const filter = `["tourism"~"^(${ATTRACTION_CATEGORIES.join("|")})$"]`;
  return (
    `[out:json][timeout:25];` +
    `(node${filter}(${box});way${filter}(${box}););` +
    `out center ${LIMIT};`
  );
}

function toAttraction(
  element: unknown,
  language: LanguageCode,
): Attraction | null {
  const parsed = overpassElementSchema.safeParse(element);
  if (!parsed.success) return null;

  const { type, id, tags, center } = parsed.data;
  if (!tags) return null;

  const category = tags.tourism;
  if (!CATEGORIES.has(category)) return null;

  // 고른 언어 → 영어 → 원어. 어느 것도 없으면 목록에 올릴 수 없다.
  const name =
    tags[`name:${language}`] ?? tags[`name:${FALLBACK_LANGUAGE}`] ?? tags.name;
  if (!name) return null;

  const lat = parsed.data.lat ?? center?.lat;
  const lon = parsed.data.lon ?? center?.lon;
  if (lat === undefined || lon === undefined) return null;

  return {
    id: `${type}/${id}`,
    name,
    category: category as AttractionCategory,
    lng: lon,
    lat,
    // 사진은 있으면 좋은 것이다 — 파리는 33%, 강원도는 4% 뿐이라
    // 화면은 없는 쪽을 기본으로 잡고 만든다.
    image: tags.wikimedia_commons?.startsWith("File:")
      ? commonsImage(tags.wikimedia_commons)
      : undefined,
    wikidata: tags.wikidata,

    description: tags[`description:${language}`] ?? tags.description,
    address: addressOf(tags),
    website: tags.website ?? tags["contact:website"],
    phone: tags.phone ?? tags["contact:phone"],
    openingHours: tags.opening_hours,
    wikipedia: tags.wikipedia,
  };
}

/**
 * 주소. `addr:full` 이 있으면 그걸 쓰고, 없으면 조각을 잇는다.
 * 나라마다 순서가 달라서 **큰 단위부터** 붙인다 — 한국·일본식이고,
 * 서양식 주소도 뒤집혀 보일 뿐 읽는 데 문제는 없다.
 */
function addressOf(tags: Record<string, string>) {
  if (tags["addr:full"]) return tags["addr:full"];

  const parts = [
    tags["addr:province"] ?? tags["addr:state"],
    tags["addr:city"],
    tags["addr:district"],
    tags["addr:street"],
    tags["addr:housenumber"],
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : undefined;
}

/**
 * 같은 장소가 점과 면으로 둘 다 등록돼 있는 경우가 흔하다.
 * 이름과 대략적인 좌표(약 100m)가 같으면 하나로 본다.
 */
function dedupe(attractions: Attraction[]) {
  const seen = new Set<string>();
  return attractions.filter((attraction) => {
    const key = `${attraction.name}@${attraction.lng.toFixed(3)},${attraction.lat.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * `wikidata` 태그가 있는 것들의 대표 이미지(P18)를 한 번에 채운다.
 *
 * **요청은 딱 하나 늘어난다** — wbgetentities 는 id 를 50개까지 한 번에 받는다.
 * 이름으로 위키백과 문서를 찾는 방법도 재보았는데 강원도 50건 중 0건이었다.
 * 지역 고유명은 문서가 없어서, 이미 붙어 있는 wikidata 링크를 쓰는 게 낫다.
 */
async function withImages(attractions: Attraction[]): Promise<Attraction[]> {
  const ids = attractions
    .filter((attraction) => !attraction.image && attraction.wikidata)
    .map((attraction) => attraction.wikidata)
    .slice(0, 50);
  if (ids.length === 0) return attractions;

  try {
    const url =
      "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json" +
      `&props=claims&ids=${ids.join("|")}`;
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: REVALIDATE },
    });
    if (!response.ok) return attractions;

    const parsed = wikidataEntitiesSchema.safeParse(await response.json());
    if (!parsed.success) return attractions;

    const images = new Map<string, string>();
    for (const [id, entity] of Object.entries(parsed.data.entities ?? {})) {
      const file = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      const image = typeof file === "string" ? commonsImage(file) : undefined;
      if (image) images.set(id, image);
    }

    return attractions.map((attraction) =>
      attraction.image || !attraction.wikidata
        ? attraction
        : { ...attraction, image: images.get(attraction.wikidata) },
    );
  } catch (error) {
    // 사진은 없어도 되는 정보다. 목록까지 버릴 이유가 없다.
    console.warn("[wikidata]", error);
    return attractions;
  }
}

/**
 * 구역 안의 명소 목록.
 *
 * **실패해도 던지지 않는다.** Overpass 가 죽거나 호출량 제한에 걸려도 지도까지
 * 같이 내려가면 안 된다 — 빈 목록을 돌려주고 화면은 그대로 뜬다.
 */
export async function fetchAttractions(
  bounds: RegionBounds,
  language: LanguageCode,
): Promise<AttractionResult> {
  // POST 가 아니라 GET 으로 부른다 — Next 의 데이터 캐시는 GET 만 저장한다
  const url = `${ENDPOINT}?data=${encodeURIComponent(buildQuery(bounds))}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await wait(RETRY_DELAY);

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: REVALIDATE },
      });

      // 429 는 슬롯 대기, 504 는 질의 시간 초과다. 둘 다 다시 물어볼 값어치가 있다.
      if (response.status === 429 || response.status === 504) {
        console.warn("[overpass]", response.status, "재시도");
        continue;
      }

      if (!response.ok) {
        console.error("[overpass]", response.status, response.statusText);
        return { status: "unavailable", attractions: [] };
      }

      const body = overpassResponseSchema.safeParse(await response.json());
      if (!body.success) {
        console.error("[overpass] 응답 모양이 다르다", body.error);
        return { status: "unavailable", attractions: [] };
      }

      const attractions = body.data.elements
        .map((element) => toAttraction(element, language))
        .filter((attraction) => attraction !== null);

      const dropped = body.data.elements.length - attractions.length;
      if (dropped > 0) {
        // 대부분 이름 없는 항목이다. 수가 크면 질의나 스키마를 의심할 것.
        console.warn(`[overpass] ${dropped}건 제외 (이름·좌표·분류 누락)`);
      }

      return { status: "ok", attractions: await withImages(dedupe(attractions)) };
    } catch (error) {
      console.error("[overpass]", error);
      return { status: "unavailable", attractions: [] };
    }
  }

  return { status: "unavailable", attractions: [] };
}
