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
 * 물어볼 곳. **순서대로 하나씩 간다.**
 *
 * **`overpass-api.de` 를 맨 앞에 두지 않는다.** 거기는 주소가 둘인데
 * (65.109.112.52 · 162.55.144.139) 그중 하나가 죽어 있고, Node 는 매번 그쪽을
 * 잡아 10초를 버린다 — 여덟 번 물어 여덟 번 다 그랬다. 브라우저나 curl 은
 * 살아 있는 쪽에 붙어서 멀쩡해 보이는 게 함정이다. 언제 고쳐질지 모르는 일이라
 * 뒤로 물리되 빼지는 않는다. 살아나면 거기가 가장 빠르고, 그때는 앞의 곳이
 * 실패해야 닿으니 순서를 되돌려 주는 게 낫다.
 *
 * **같은 질의도 곳마다 딴판이다.** 충칭을 물었더니 mail.ru 는 3.9초에 180건을
 * 주고 private.coffee 와 kumi 는 32초를 끌다 504 를 냈다. 그러니 한 곳이
 * 시간을 다 썼다고 해서 "무거운 질의라 어디서도 안 된다" 고 볼 수 없다 —
 * 끝까지 돌아 본다. 대신 전부 합쳐 `BUDGET` 을 넘기지 않는다.
 *
 * **osm.ch 는 넣으면 안 된다** — 200 을 주면서 0건을 돌려주는 지역 미러라,
 * 폴백에 끼면 "명소가 없는 구역" 으로 조용히 둔갑한다. osm.jp 는 인증서가
 * 만료됐다.
 */
const ENDPOINTS = [
  {
    url: "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    timeout: 30_000,
  },
  { url: "https://overpass-api.de/api/interpreter", timeout: 20_000 },
  { url: "https://overpass.private.coffee/api/interpreter", timeout: 30_000 },
];

/**
 * 전부 합쳐 기다리는 한계(ms). 곳을 늘려도 사용자가 기다리는 시간은 안 늘어난다.
 *
 * 이게 없으면 곳마다의 한계가 그대로 더해져서, 세 곳이 다 막힌 날 서버 렌더가
 * 80초씩 붙들린다. 남은 시간이 `MIN_ATTEMPT` 도 안 되면 시작하지 않는다 —
 * 어차피 못 끝낼 요청을 걸어 놓고 끊는 건 저쪽에도 폐다.
 */
const BUDGET = 45_000;
const MIN_ATTEMPT = 5_000;

/**
 * 방금 안 됐던 곳은 얼마 동안 건너뛴다(ms).
 *
 * **한 번 죽은 곳은 다음 요청에서도 죽어 있다.** 본진이 막힌 동안 재 보니
 * 8번 물어 8번 다 10초씩 버렸다 — 그 10초가 위 `BUDGET` 을 갉아먹어서, 정작
 * 답을 줄 수 있는 미러가 시간이 모자라 시도조차 못 됐다.
 *
 * 마지막 한 곳은 건너뛰지 않는다. 전부 쉬는 중이면 아무 데도 안 물어보고
 * 빈손으로 끝나는데, 그러면 회복된 뒤에도 이 시간이 지나야 살아난다.
 *
 * 15분은 **죽은 곳에 버리는 10초**와 **살아난 것을 늦게 아는 것** 사이의
 * 절충이다. 명소는 하루치로 캐시하니 늦게 알아채도 손해가 크지 않다.
 */
const COOLDOWN = 15 * 60 * 1000;
const failedAt = new Map<string, number>();

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

/** 다음 곳으로 넘어가기 전에 쉬는 시간(ms). 공용 서버에 몰아치지 않는다. */
const RETRY_DELAY = 1500;

/**
 * 사진을 기다리는 한계(ms). 명소 쪽 한계는 `ENDPOINTS` 가 곳마다 들고 있다.
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
   * 한 곳이 안 되면 다음 곳으로 넘어간다. **주소가 서로 달라야** 한다는 조건도
   * 이걸로 저절로 풀린다 — Next 는 한 렌더 안에서 주소와 옵션이 같은 GET 을
   * 합치므로, 같은 곳에 두 번 물으면 두 번째가 새 요청을 내지 않고 방금 받은
   * 429 를 그대로 다시 받는다.
   */
  const started = Date.now();
  /** 실제로 물어본 적이 있는지. 쉬는 곳을 건너뛴 것은 여기 안 든다. */
  let asked = false;

  for (let attempt = 0; attempt < ENDPOINTS.length; attempt++) {
    const endpoint = ENDPOINTS[attempt];
    const rested = failedAt.get(endpoint.url);
    if (
      rested !== undefined &&
      Date.now() - rested < COOLDOWN &&
      attempt < ENDPOINTS.length - 1
    ) {
      continue;
    }

    // 쉬는 곳을 건너뛴 것은 요청이 아니다 — 그 몫까지 쉴 이유가 없다
    if (asked) await wait(RETRY_DELAY);

    const left = BUDGET - (Date.now() - started);
    if (left < MIN_ATTEMPT) {
      console.warn("[overpass] 남은 시간이 없어 그만둔다");
      break;
    }

    const timeout = Math.min(endpoint.timeout, left);
    const { url } = endpoint;
    // 어디서 막혔는지 남긴다 — 곳마다 사정이 달라서 이게 없으면 못 가른다
    const where = new URL(url).host;
    // 답을 받아 읽는 시간도 있으니 저쪽에는 2초 덜 준다
    const query = encodeURIComponent(
      buildQuery(bounds, Math.round(timeout / 1000) - 2),
    );

    asked = true;

    try {
      // POST 가 아니라 GET 으로 부른다 — Next 의 데이터 캐시는 GET 만 저장한다
      const response = await fetch(`${url}?data=${query}`, {
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: REVALIDATE },
        signal: AbortSignal.timeout(timeout),
      });

      // 429 는 슬롯 대기, 5xx 는 저쪽 사정이다. 둘 다 다른 곳에 물어볼 값어치가 있다.
      if (response.status === 429 || response.status >= 500) {
        console.warn("[overpass]", where, response.status, "다음 곳으로");
        failedAt.set(url, Date.now());
        continue;
      }

      // 4xx 는 질의가 잘못됐다는 뜻이라 어디에 물어도 같은 답이 온다
      if (!response.ok) {
        console.error("[overpass]", where, response.status, response.statusText);
        return { status: "unavailable", attractions: [] };
      }

      const body = overpassResponseSchema.safeParse(await response.json());
      if (!body.success) {
        // 곳마다 무엇을 돌려주는지가 다르다 — 여기서 끝내지 말고 다음에 물어본다
        console.error("[overpass]", where, "응답 모양이 다르다", body.error);
        failedAt.set(url, Date.now());
        continue;
      }

      /**
       * 사유가 적혀 왔으면 못 끝냈다는 뜻이다 — **빈 목록을 성공으로 삼으면
       * 안 된다.** 그대로 두면 하루치 캐시에 0건이 박혀서, 서버가 한가해진
       * 뒤에도 그 구역은 내내 비어 보인다.
       */
      if (body.data.remark) {
        console.warn("[overpass]", where, body.data.remark.slice(0, 80));
        failedAt.set(url, Date.now());
        continue;
      }

      // 제대로 답한 곳이다 — 쉬는 표가 남아 있으면 지운다
      failedAt.delete(url);

      const attractions = body.data.elements
        .map((element) => toAttraction(element, language))
        .filter((attraction) => attraction !== null);

      const dropped = body.data.elements.length - attractions.length;
      if (dropped > 0) {
        // 대부분 이름 없는 항목이다. 수가 크면 질의나 스키마를 의심할 것.
        console.warn(`[overpass] ${dropped}건 제외 (이름·좌표·분류 누락)`);
      }

      // 거른 뒤에 자른다 — 먼저 자르면 걸러질 것이 화면 자리를 차지한다
      const kept = dedupe(inRegion(region, attractions)).slice(0, LIMIT);
      return { status: "ok", attractions: await withImages(kept) };
    } catch (error) {
      /**
       * **어떤 실패든 다음 곳으로 간다.** 시간을 다 썼든(`TimeoutError`) 연결이
       * 아예 안 됐든(`TypeError`) 그건 그 곳의 사정이다 — 충칭 질의를 한 곳은
       * 32초 끌다 놓쳤고 다른 곳은 3.9초에 줬다. 위의 `BUDGET` 이 전체를
       * 묶고 있으니 여기서 따로 끊을 이유가 없다.
       */
      console.error(
        "[overpass]",
        where,
        error instanceof Error ? error.name : error,
      );
      failedAt.set(url, Date.now());
    }
  }

  return { status: "unavailable", attractions: [] };
});
