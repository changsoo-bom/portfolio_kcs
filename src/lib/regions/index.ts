import "server-only";

import countryNames from "@/data/country-names.json";
import regionIndex from "@/data/region-index.json";
import { FALLBACK_LANGUAGE } from "@/constants/languages";
import { countryOf } from "@/lib/regions/code";
import type { LanguageCode } from "@/constants/languages";
import type { RegionBounds } from "@/types/attraction";

export { countryOf };

/**
 * 나라·구역 표 조회. **서버에서만 읽는다**(합쳐서 1.3MB).
 *
 * 맨 위의 `server-only` 가 그걸 강제한다. 예전에는 이 주석이 유일한 방어라,
 * 누가 클라이언트 컴포넌트에서 이름 조회 함수 하나를 값으로 가져다 쓰면
 * 1.3MB 가 조용히 번들에 실렸다 — 빌드도 린트도 안 막고, 번들 크기를 재 볼
 * 때에야 드러난다. 지금은 그 import 가 빌드를 깬다.
 */
type RegionEntry = { bbox: number[]; names: Record<string, string> };

/** 생성된 JSON 이라 리터럴 타입이 붙는다. 여기서 한 번만 넓혀 쓴다. */
const REGIONS: Record<string, RegionEntry> = regionIndex;
const COUNTRIES: Record<string, Record<string, string>> = countryNames;

/** 드롭다운 한 줄. */
export type RegionOption = { value: string; label: string };

/** 주사위가 뽑아 준 구역. 서버가 골라 화면으로 넘긴다. */
export type RegionPick = { id: string; bounds: RegionBounds; name: string };

const nameOf = (names: Record<string, string>, language: LanguageCode) =>
  names[language] ?? names[FALLBACK_LANGUAGE] ?? names.local;

/** 구역이 있는 나라만. 이름을 모르는 코드(군사기지·분쟁지 등)는 뺀다. */
export function countryOptions(language: LanguageCode): RegionOption[] {
  const codes = new Set(Object.keys(REGIONS).map(countryOf));

  return (
    [...codes]
      .filter((code) => COUNTRIES[code])
      .map((code) => ({ value: code, label: nameOf(COUNTRIES[code], language) }))
      /**
       * 이름이 빈 것은 여기서 뺀다. 아래 `localeCompare` 는 undefined 를 받는
       * 순간 터지는데, 지금 데이터는 242개 전부 영어 이름이 있어서 안 터질
       * 뿐이다 — 아래 `regionOptions` 는 이미 이 줄을 갖고 있다.
       */
      .filter((option) => option.label)
      .sort((a, b) => a.label.localeCompare(b.label, language))
  );
}

export function regionOptions(
  country: string,
  language: LanguageCode,
): RegionOption[] {
  return Object.entries(REGIONS)
    .filter(([id]) => countryOf(id) === country)
    .map(([id, entry]) => ({ value: id, label: nameOf(entry.names, language) }))
    .filter((option) => option.label)
    .sort((a, b) => a.label.localeCompare(b.label, language));
}

/**
 * 아무 구역이나 하나. 지구본만 보고 어디를 눌러야 할지 모르는 사람에게
 * 시작점을 준다.
 *
 * **뽑는 일은 서버가 한다.** 구역이 4584개라 목록을 클라이언트로 보낼 수 없고,
 * 페이지가 요청마다 새로 렌더되므로 누를 때마다 다른 곳이 나온다.
 *
 * 이름이 없는 구역은 뺀다 — 도착해서 패널 제목이 비면 어디에 온 건지 모른다.
 */
export function randomRegion(language: LanguageCode): RegionPick | null {
  const ids = Object.keys(REGIONS).filter((id) =>
    nameOf(REGIONS[id].names, language),
  );
  if (ids.length === 0) return null;

  const id = ids[Math.floor(Math.random() * ids.length)];
  const entry = regionEntryOf(id, language);
  return entry ? { id, ...entry } : null;
}

export function countryNameOf(country: string, language: LanguageCode) {
  const names = COUNTRIES[country];
  return names ? nameOf(names, language) : null;
}

/**
 * 구역 정보. 없는 id 면 null 이다 — 주소창을 손으로 고친 경우까지 여기서 막힌다.
 */
export function regionEntryOf(
  region: string,
  language: LanguageCode,
): { bounds: RegionBounds; name: string } | null {
  const entry = REGIONS[region];
  if (!entry || entry.bbox.length !== 4) return null;

  const [west, south, east, north] = entry.bbox;

  return {
    bounds: { west, south, east, north },
    name: nameOf(entry.names, language) ?? region,
  };
}

/**
 * 나라 전체를 감싸는 상자. 그 나라 구역들의 상자를 합친다.
 *
 * **날짜변경선을 넘는 나라가 있다**(러시아·미국·피지). 경도를 그대로 합치면
 * 상자가 지구를 한 바퀴 감싸서 지구본 전체로 줌아웃된다. 음수 경도를 +360 해
 * 한 번 더 재보고 그쪽이 좁으면 그 상자를 쓴다 — MapLibre 는 180 을 넘는
 * 경도를 그대로 받는다.
 */
export function countryBoundsOf(country: string): RegionBounds | null {
  const boxes = Object.entries(REGIONS)
    .filter(([id]) => countryOf(id) === country)
    .map(([, entry]) => entry.bbox)
    .filter((bbox) => bbox.length === 4);
  if (boxes.length === 0) return null;

  const merge = (shift: boolean) => {
    let west = Infinity;
    let south = Infinity;
    let east = -Infinity;
    let north = -Infinity;

    for (const [w, s, e, n] of boxes) {
      const left = shift && w < 0 ? w + 360 : w;
      const right = shift && e < 0 ? e + 360 : e;
      west = Math.min(west, left);
      east = Math.max(east, right);
      south = Math.min(south, s);
      north = Math.max(north, n);
    }

    return { west, south, east, north };
  };

  const plain = merge(false);
  const shifted = merge(true);
  const width = (box: RegionBounds) => box.east - box.west;

  return width(shifted) < width(plain) ? shifted : plain;
}
