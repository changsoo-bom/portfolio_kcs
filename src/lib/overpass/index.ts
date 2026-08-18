import { cache } from "react";

import { regionEntryOf } from "@/lib/regions";
import { regionShape } from "@/lib/regions/shape";
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

/**
 * 물어볼 곳. **먼저 답하는 곳을 쓴다.**
 *
 * 예전에는 순서대로 하나씩 갔는데, 그러면 앞의 곳이 느린 날 그 시간이 통째로
 * 사용자 몫이 된다 — 서울을 열었더니 14초였다. 1순위 mail.ru 가 혼자 20초를
 * 쓰는 동안 나머지는 시작조차 못 한다.
 *
 * **같은 질의도 곳마다 딴판이다.** 충칭을 물었더니 mail.ru 는 3.9초에 180건을
 * 주고 private.coffee 와 kumi 는 32초를 끌다 504 를 냈다. 서울은 그 반대였다.
 * 어느 곳이 빠른지 미리 알 수 없으니 **물어보고 먼저 오는 것을 쓴다.**
 *
 * 그래서 죽은 곳을 건너뛰던 쿨다운 표도, 전부 합친 예산도 없앴다. 한 곳이
 * 죽어 있어도 기다림이 안 늘어나는 구조라 둘 다 지킬 대상이 사라졌다.
 *
 * **osm.ch 는 넣으면 안 된다** — 200 을 주면서 0건을 돌려주는 지역 미러라,
 * 끼워 두면 "명소가 없는 구역" 으로 조용히 둔갑한다. 먼저 답하는 쪽을 쓰는
 * 지금은 그 위험이 예전보다 크다 — 빈손이 가장 빨리 온다.
 * osm.jp 는 인증서가 만료됐다.
 */
const ENDPOINTS = [
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

/**
 * 한 곳에 주는 시간(ms). 서울 질의가 mail.ru 에서 20초 걸렸으니 그보다 넉넉해야
 * 한다 — 짧게 잡으면 유일하게 답할 참이던 곳을 끊는다.
 *
 * 곳마다 따로 두지 않는다. 동시에 물어서 먼저 오는 것을 쓰므로 느린 곳에 짧은
 * 한계를 주는 것이 아무것도 벌어 주지 않는다.
 */
const TIMEOUT = 25_000;

/**
 * 첫 곳을 혼자 기다려 보는 시간(ms). 이 안에 답이 오면 나머지에는 **묻지 않는다.**
 *
 * 세 곳에 늘 던지면 가장 빠르긴 하지만, 공용 무료 서버 셋에 매번 같은 질의를
 * 세 번 시키는 셈이라 예의가 아니다. 하루치 캐시에 얹혀 있는 흔한 경우는 첫
 * 곳이 곧바로 답하므로, 실제로 세 곳이 도는 건 캐시가 빈 첫 방문뿐이다.
 */
const HEDGE_DELAY = 1_500;

/** 한 구역에서 화면에 올릴 최대 개수. 도(道) 단위면 이 정도로 충분히 찬다. */
const LIMIT = 120;

/**
 * Overpass 에 물어볼 개수. **화면에 올릴 것보다 넉넉히 받는다** — 상자로만
 * 물어볼 수 있어서 이웃 구역 것이 섞여 오고, 그걸 걸러 내면 줄어든다.
 * 구역이 제 상자를 채우는 비율은 중앙값이 52% 라 절반쯤 빠질 각오를 한다.
 */
const FETCH_LIMIT = 180;

/**
 * 캐시 수명(초). OSM 명소는 하루 단위로 바뀌지 않는다.
 *
 * **Overpass 는 공용 무료 서버라 호출량 제한이 있다.** 클라이언트에서 직접
 * 부르면 방문자 수만큼 그대로 나가지만, 서버에서 부르고 캐시하면 구역당 하루
 * 한 번으로 줄어든다. 이 기능을 서버 컴포넌트로 만든 실질적인 이유다.
 */
const REVALIDATE = 60 * 60 * 24;

/** 공용 서버 예의 — 어디서 오는 요청인지 밝힌다. */
const USER_AGENT = "world-atlas (https://github.com/changsoo-bom/world-atlas)";

/**
 * 사진을 기다리는 한계(ms). 명소 쪽 한계는 위의 `TIMEOUT` 이다.
 *
 * **질의문의 `[out:json][timeout:25]` 는 이걸 대신하지 못한다** — 그건 Overpass
 * 서버가 계산에 쓰는 시간이지 커넥션 한계가 아니다. Node 의 `fetch` 는 기본
 * 타임아웃이 없어서, 상대가 커넥션만 잡고 응답을 안 주면 명소 목록·개수·마커의
 * 기다림이 영영 안 끝나고 그 요청의 서버 렌더도 끝나지 않는다.
 *
 * 사진 쪽을 짧게 잡은 건 그게 **목록의 길목에 있기 때문이다.** 위키데이터가
 * 느리면 사진이 아니라 명소 이름조차 안 뜬다.
 */
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
   *
   * 다만 두 글자 코드만 있는 게 아니다 — `simple`, `zh-min-nan`, `be-x-old`,
   * `zh-classical` 처럼 길거나 하이픈이 둘인 판이 실제로 있다. 좁게 잡으면
   * 그런 명소는 링크가 조용히 사라진다. 점도 슬래시도 대문자도 못 들어오니
   * 넓혀도 호스트는 못 바꾼다.
   */
  if (!title || !/^[a-z]{2,10}(-[a-z]{1,10}){0,2}$/.test(language)) {
    return undefined;
  }

  return `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
}

/**
 * http·https 만 통과시킨다. 파싱이 안 되는 값도 버린다.
 *
 * **스킴이 빠진 값은 버리지 않고 붙여 준다** — OSM 의 `website` 에는
 * `www.example.com` 처럼 적힌 것이 흔한데, 그대로 두면 파싱이 실패해서
 * 홈페이지 줄이 통째로 사라진다.
 */
function webUrl(value: string | undefined) {
  if (!value) return undefined;

  const parse = (candidate: string) => {
    try {
      const url = new URL(candidate);
      return url.protocol === "http:" || url.protocol === "https:"
        ? url.href
        : undefined;
    } catch {
      return undefined;
    }
  };

  // 스킴이 있는데 http 계열이 아니면(`javascript:` 등) 거기서 끝이다.
  // 그런 값에 다시 https 를 덧대면 없던 링크를 만들어 내는 셈이 된다.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return parse(value);
  return parse(`https://${value}`);
}

/**
 * 전화번호에 쓰이는 문자만. `tel:` 뒤에 무엇이든 들어가게 두지 않는다.
 *
 * OSM 은 번호 여러 개를 `;` 로 잇는 관행이 있다 — 통째로 버리지 말고
 * 첫 번호만 쓴다.
 */
const phoneOf = (value: string | undefined) => {
  const first = value?.split(";")[0]?.trim();
  return first && /^[+0-9][0-9 ()./-]{2,31}$/.test(first) ? first : undefined;
};

/**
 * Overpass 의 상자 순서는 (남, 서, 북, 동) 이다 — 흔히 쓰는 순서와 다르다.
 *
 * 질의문의 `timeout` 은 **저쪽이 계산에 쓸 수 있는 시간**이라, 우리가 기다리는
 * 시간과 따로 놀면 안 된다. 짧게 박아 두면 넓은 구역(충칭·뉴욕주)에서 저쪽이
 * 먼저 손을 들어 504 를 보내는데, 정작 우리는 아직 한참 기다릴 참이었다.
 * 그래서 그 곳에 준 시간에서 조금 뺀 값을 넣는다.
 */
function buildQuery(
  { west, south, east, north }: RegionBounds,
  seconds: number,
) {
  const box = `${south},${west},${north},${east}`;
  const filter = `["tourism"~"^(${ATTRACTION_CATEGORIES.join("|")})$"]`;
  return (
    `[out:json][timeout:${seconds}];` +
    `(node${filter}(${box});way${filter}(${box}););` +
    `out center ${FETCH_LIMIT};`
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
 * 구역 밖의 것을 떨군다.
 *
 * **상자로 물어본 결과에는 이웃 구역이 섞여 있다.** 서울을 열면 부천
 * 만화박물관과 남한산성이 딸려 오는 식인데(실측 120건 중 16건), 여기서
 * 실제 경계로 한 번 더 거른다. 모양을 못 구한 구역은 그대로 둔다 —
 * 근거 없이 비우는 것보다 상자 그대로가 낫다.
 */
function inRegion(region: string, attractions: Attraction[]) {
  const shape = regionShape(region);
  if (!shape) return attractions;

  const kept = attractions.filter((a) => shape(a.lng, a.lat));
  const dropped = attractions.length - kept.length;
  if (dropped > 0) console.info(`[overpass] ${dropped}건 구역 밖 (${region})`);

  return kept;
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
 * 한 곳에 물어본다. **쓸 만한 답이 아니면 던진다** — 부르는 쪽이 다른 곳을 쓴다.
 *
 * 4xx 는 질의가 잘못됐다는 뜻이라 어디에 물어도 같은 답이 오지만, 여기서
 * 따로 가르지 않는다. 어차피 세 곳이 다 같은 이유로 실패하고, 그러면 부르는
 * 쪽이 빈손으로 끝내는 것은 매한가지다.
 */
async function ask(url: string, bounds: RegionBounds, signal: AbortSignal) {
  // 어디서 막혔는지 남긴다 — 곳마다 사정이 달라서 이게 없으면 못 가른다
  const where = new URL(url).host;
  // 답을 받아 읽는 시간도 있으니 저쪽에는 2초 덜 준다
  const query = encodeURIComponent(buildQuery(bounds, TIMEOUT / 1000 - 2));

  // POST 가 아니라 GET 으로 부른다 — Next 의 데이터 캐시는 GET 만 저장한다
  const response = await fetch(`${url}?data=${query}`, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: REVALIDATE },
    /**
     * 두 가지 이유로 끊길 수 있다: 저쪽이 너무 느리거나(`timeout`), 다른 곳이
     * 먼저 답했거나(`signal`). Node 의 `fetch` 는 기본 타임아웃이 없어서,
     * 앞의 것이 없으면 상대가 커넥션만 잡고 응답을 안 줄 때 서버 렌더가
     * 영영 안 끝난다.
     */
    signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT)]),
  });

  if (!response.ok) {
    throw new Error(`${where} ${response.status} ${response.statusText}`);
  }

  const body = overpassResponseSchema.safeParse(await response.json());
  // 곳마다 무엇을 돌려주는지가 다르다 — 여기서 끝내지 말고 다른 곳 답을 쓴다
  if (!body.success) throw new Error(`${where} 응답 모양이 다르다`);

  /**
   * 사유가 적혀 왔으면 못 끝냈다는 뜻이다 — **빈 목록을 성공으로 삼으면
   * 안 된다.** 그대로 두면 하루치 캐시에 0건이 박혀서, 서버가 한가해진
   * 뒤에도 그 구역은 내내 비어 보인다.
   */
  if (body.data.remark) {
    throw new Error(`${where} ${body.data.remark.slice(0, 80)}`);
  }

  return body.data.elements;
}

/**
 * 구역 안의 명소 목록.
 *
 * **실패해도 던지지 않는다.** Overpass 가 죽거나 호출량 제한에 걸려도 지도까지
 * 같이 내려가면 안 된다 — 빈 목록을 돌려주고 화면은 그대로 뜬다.
 *
 * `cache` 로 감싼 건 목록·개수·마커·상세가 각각 부르기 때문이다. fetch 가
 * 합쳐지니 요청은 하나뿐이지만 **함수 본문은 네 번 돌아서**, Zod 요소 파싱만
 * 120건 × 4 = 480회였다. 인자가 둘 다 문자열이라 키는 값으로 맞는다.
 *
 * 상자가 아니라 **구역 id 를 받는다.** 상자는 여기서 표를 찾아 쓰고, 그래야
 * 걸러 낼 때 쓸 실제 모양도 같은 id 로 집어 온다 — 부르는 쪽이 상자와 모양을
 * 따로 넘기면 둘이 어긋난 채로도 조용히 돈다.
 */
export const fetchAttractions = cache(async function fetchAttractions(
  region: string,
  language: LanguageCode,
): Promise<AttractionResult> {
  const entry = regionEntryOf(region, language);
  if (!entry) return { status: "unavailable", attractions: [] };

  const { bounds } = entry;

  /**
   * 먼저 답한 곳이 정해지면 나머지는 여기서 끊는다 — 쓰지도 않을 답을 공용
   * 서버에 계속 계산시키지 않는다.
   */
  const controller = new AbortController();

  const attempts = ENDPOINTS.map(async (url, index) => {
    /**
     * 첫 곳 말고는 잠깐 기다렸다 던진다. 첫 곳이 그 안에 답하면 — 캐시에
     * 있으면 늘 그렇다 — 아래 `finally` 가 이미 끊어 놓은 뒤라 요청이 아예
     * 나가지 않는다.
     */
    if (index > 0) await wait(HEDGE_DELAY);
    return ask(url, bounds, controller.signal);
  });

  let elements;
  try {
    /**
     * **먼저 성공한 것을 쓴다.** 실패는 세는 게 아니라 무시한다 — 세 곳이 다
     * 실패해야 `AggregateError` 로 떨어진다.
     *
     * `Promise.any` 는 넘긴 것 전부에 핸들러를 달아 두므로, 정착한 뒤에 늦게
     * 실패하는 나머지가 처리되지 않은 거부로 새지 않는다.
     */
    elements = await Promise.any(attempts);
  } catch (error) {
    // 전부 안 됐다. 곳마다 사정이 달라서 이유를 다 남겨야 나중에 가릴 수 있다.
    const reasons = error instanceof AggregateError ? error.errors : [error];
    console.error("[overpass] 전부 실패 —", reasons.map(String).join(" · "));
    return { status: "unavailable", attractions: [] };
  } finally {
    controller.abort();
  }

  const attractions = elements
    .map((element) => toAttraction(element, language))
    .filter((attraction) => attraction !== null);

  const dropped = elements.length - attractions.length;
  if (dropped > 0) {
    // 대부분 이름 없는 항목이다. 수가 크면 질의나 스키마를 의심할 것.
    console.warn(`[overpass] ${dropped}건 제외 (이름·좌표·분류 누락)`);
  }

  // 거른 뒤에 자른다 — 먼저 자르면 걸러질 것이 화면 자리를 차지한다
  const kept = dedupe(inRegion(region, attractions)).slice(0, LIMIT);
  return { status: "ok", attractions: await withImages(kept) };
});
