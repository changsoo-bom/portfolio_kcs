import { cache } from "react";

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

/**
 * 응답을 기다리는 한계(ms).
 *
 * **질의문의 `[out:json][timeout:25]` 는 이걸 대신하지 못한다** — 그건 Overpass
 * 서버가 계산에 쓰는 시간이지 커넥션 한계가 아니다. Node 의 `fetch` 는 기본
 * 타임아웃이 없어서, 상대가 커넥션만 잡고 응답을 안 주면 명소 목록·개수·마커의
 * 기다림이 영영 안 끝나고 그 요청의 서버 렌더도 끝나지 않는다.
 *
 * 사진 쪽을 짧게 잡은 건 그게 **목록의 길목에 있기 때문이다.** 위키데이터가
 * 느리면 사진이 아니라 명소 이름조차 안 뜬다.
 */
const TIMEOUT = 20_000;
const IMAGE_TIMEOUT = 5_000;

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

/** `Set.has()` 는 타입을 안 좁힌다 — 술어로 감싸야 `as` 단언이 사라진다. */
const isCategory = (value: string): value is AttractionCategory =>
  CATEGORIES.has(value);

/**
 * ── 링크는 여기서 거른다.
 *
 * **OpenStreetMap 태그는 누구나 편집한다.** 그런데 아래 값들은 화면에서
 * `href` 가 되므로, 걸러지지 않으면 "위키백과" 라고 적힌 버튼이 아무 데로나
 * 나갈 수 있다. 신뢰 경계가 여기라 바깥 컴포넌트는 검증된 값만 본다.
 */

/** `ko:경복궁` → 위키백과 주소. 언어 접두사가 수상하면 링크를 안 건다. */
function wikipediaUrl(value: string | undefined) {
  if (!value) return undefined;

  const [language, ...rest] = value.split(":");
  const title = rest.join(":");
  /**
   * **접두사를 반드시 본다.** 예전에는 제목만 인코딩하고 접두사를 그대로
   * 주소에 박았는데, 그러면 태그가 `evil.example/#:경복궁` 일 때 최종 주소의
   * **호스트가 통째로 바뀐다**.
   */
  if (!title || !/^[a-z]{2,3}(-[a-z]{2,8})?$/.test(language)) return undefined;

  return `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
}

/** http·https 만 통과시킨다. 파싱이 안 되는 값도 버린다. */
function webUrl(value: string | undefined) {
  if (!value) return undefined;

  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:" ? value : undefined;
  } catch {
    return undefined;
  }
}

/** 전화번호에 쓰이는 문자만. `tel:` 뒤에 무엇이든 들어가게 두지 않는다. */
const phoneOf = (value: string | undefined) =>
  value && /^[+0-9][0-9 ()./-]{2,31}$/.test(value) ? value : undefined;

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
  if (!isCategory(category)) return null;

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
    category,
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
    website: webUrl(tags.website ?? tags["contact:website"]),
    phone: phoneOf(tags.phone ?? tags["contact:phone"]),
    openingHours: tags.opening_hours,
    // 태그가 아니라 **완성된 주소**를 넘긴다 — 조립을 화면 쪽에 두면
    // 검증도 거기로 따라가고, 그러면 신뢰 경계가 두 곳이 된다
    wikipedia: wikipediaUrl(tags.wikipedia),
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
    // 태그 값이 그대로 주소에 들어간다 — `&` 하나가 섞이면 파라미터가
    // 밀려서 50건의 사진이 통째로 안 나온다
    .filter((id) => id !== undefined && /^Q\d+$/.test(id))
    .slice(0, 50);
  if (ids.length === 0) return attractions;

  try {
    const url =
      "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json" +
      `&props=claims&ids=${ids.join("|")}`;
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: REVALIDATE },
      signal: AbortSignal.timeout(IMAGE_TIMEOUT),
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
 *
 * `cache` 로 감싼 건 목록·개수·마커·상세가 각각 부르기 때문이다. fetch 가
 * 합쳐지니 요청은 하나뿐이지만 **함수 본문은 네 번 돌아서**, Zod 요소 파싱만
 * 120건 × 4 = 480회였다. 페이지가 넘기는 상자는 같은 객체 하나라 키가 맞는다.
 */
export const fetchAttractions = cache(async function fetchAttractions(
  bounds: RegionBounds,
  language: LanguageCode,
): Promise<AttractionResult> {
  // POST 가 아니라 GET 으로 부른다 — Next 의 데이터 캐시는 GET 만 저장한다
  const url = `${ENDPOINT}?data=${encodeURIComponent(buildQuery(bounds))}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await wait(RETRY_DELAY);

    try {
      /**
       * **두 번째 시도는 주소를 갈라야 한다.** Next 는 한 렌더 안에서 주소와
       * 옵션이 같은 GET 을 합치는데, 그러면 재시도가 새 요청을 내지 않고
       * 방금 받은 429 를 그대로 다시 받는다 — 1.5초를 자고 같은 실패를 두 번
       * 찍을 뿐이다. Overpass 는 `data` 말고는 안 보므로 이 값을 무시한다.
       */
      const response = await fetch(attempt ? `${url}&retry=${attempt}` : url, {
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: REVALIDATE },
        signal: AbortSignal.timeout(TIMEOUT),
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
});
