/**
 * 행정구역(admin-1) 폴리곤을 내려받아 `public/admin1.geojson` 으로 줄여 쓴다.
 *
 * 왜 별도 데이터가 필요한가 — 지도 타일로 쓰는 OpenMapTiles 스키마에는
 * **행정구역 면이 없다.** boundary 는 선이라 호버로 칠할 대상이 되지 못한다.
 *
 * 출처: Natural Earth 1:10m Admin 1 (public domain).
 *
 * **50m 을 쓰면 안 된다** — 그 스케일에는 러시아·미국·인도 등 큰 나라 9개,
 * 294개 구역밖에 없다. 전 세계가 들어 있는 건 10m 뿐인데 38.8MB 라
 * 그대로는 브라우저에 못 올린다. 그래서 여기서 세 번 줄인다.
 *
 *   1. 속성 130여 개 → 쓰는 것만 (FCLASS_* 분쟁 표기와 안 쓰는 언어를 버린다)
 *   2. Douglas–Peucker 간소화
 *   3. 좌표 소수점 4자리(약 11m) 반올림
 *
 * 간소화는 폴리곤마다 따로 걸리므로 이웃과의 경계가 미세하게 어긋난다.
 * 이 데이터로 **선을 그리지 않기 때문에** 문제가 되지 않는다 — 화면에 보이는
 * 경계선은 OpenStreetMap 쪽이고, 이건 호버 판정과 채움에만 쓴다.
 *
 *   node scripts/build-admin1.mjs
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

import { LANGUAGES } from "../src/constants/languages.ts";

const CODES = LANGUAGES.map((language) => language.code);

const SOURCE =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson";

/**
 * **나라별로 쪼개 쓴다.** 전 세계를 한 파일로 만들면 간소화 후에도 11MB 라,
 * MapLibre 워커가 그걸 파싱하고 다시 타일로 자르는 동안 눈에 띄게 멈춘다.
 * 어차피 나라를 고른 뒤에 보는 데이터여서 그때 그 나라 것만 받으면 된다.
 *
 * 파일명은 ADM0_A3 — 지도 타일의 나라 속성과 같은 코드다. 둘 다 Natural Earth
 * 계열이라 그대로 맞아떨어진다.
 */
const DEST_DIR = new URL("../public/admin1/", import.meta.url);

/**
 * 구역 id → 경계 상자 + 언어별 이름.
 *
 * 서버가 `?region=` 하나만 보고 Overpass 질의를 만들고 패널 제목까지 그릴 수
 * 있어야 한다. 지오메트리는 클라이언트 전용이라 여기서는 뺀다.
 *
 * **키는 iso_3166_2 가 아니라 adm1_code 다.** ISO 코드는 유일하지 않다 —
 * `BA-BIH` 하나에 보스니아 9개 주가 걸려 있고 `AU-NSW` 에는 뉴사우스웨일스와
 * 로드하우섬이 같이 묶인다. adm1_code 는 Natural Earth 가 피처마다 매기는 값이다.
 */
const INDEX_DEST = new URL("../src/data/region-index.json", import.meta.url);

/**
 * 간소화 허용 오차(도). 0.004° ≒ 450m.
 * 지역 레이어는 zoom 9 까지만 켜지는데, 그때 1px 이 약 0.0014° 라 3px 남짓이다.
 */
const TOLERANCE = 0.004;

/** 링을 닫으려면 최소 4점이 필요하다. 그 아래로 줄어든 조각은 버린다. */
const MIN_RING = 4;

/**
 * 가로세로가 둘 다 이보다 작은 링은 버린다(도). 0.01° ≒ 1.1km.
 * 지역 레이어 최대 배율에서도 몇 픽셀짜리 점이라 호버가 안 잡히는데,
 * 이런 부속 도서가 피처마다 수백 개씩 붙어 용량의 상당 부분을 차지한다.
 */
const MIN_RING_SIZE = 0.01;

/** 점에서 선분까지 거리의 제곱. 제곱근은 비교에 필요 없어 생략한다. */
function squaredDistance(point, start, end) {
  let [x, y] = start;
  let dx = end[0] - x;
  let dy = end[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) [x, y] = end;
    else if (t > 0) [x, y] = [x + dx * t, y + dy * t];
  }

  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
}

/** Douglas–Peucker. 재귀 대신 스택을 쓴다 — 링 하나가 수만 점까지 간다. */
function simplify(points, tolerance) {
  if (points.length <= 2) return points;

  const squaredTolerance = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;

  const stack = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [first, last] = stack.pop();
    let farthest = -1;
    let maxDistance = squaredTolerance;

    for (let i = first + 1; i < last; i++) {
      const distance = squaredDistance(points[i], points[first], points[last]);
      if (distance > maxDistance) {
        farthest = i;
        maxDistance = distance;
      }
    }

    if (farthest > 0) {
      keep[farthest] = 1;
      stack.push([first, farthest], [farthest, last]);
    }
  }

  return points.filter((_, index) => keep[index] === 1);
}

const round = (point) => [
  Math.round(point[0] * 1e4) / 1e4,
  Math.round(point[1] * 1e4) / 1e4,
];

/** 링 하나를 간소화한다. 너무 잘거나 잘게 부서졌으면 null 을 돌려 버리게 한다. */
function reduceRing(ring) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (maxX - minX < MIN_RING_SIZE && maxY - minY < MIN_RING_SIZE) return null;

  const simplified = simplify(ring, TOLERANCE).map(round);
  if (simplified.length < MIN_RING) return null;
  // 반올림 때문에 첫 점과 끝 점이 갈라질 수 있다 — 링은 닫혀 있어야 한다
  const [first] = simplified;
  const last = simplified[simplified.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) simplified.push([...first]);
  return simplified;
}

/** Polygon 은 링의 배열, MultiPolygon 은 그 배열의 배열이다. */
function reducePolygon(rings) {
  const reduced = rings.map(reduceRing).filter(Boolean);
  // 바깥 링이 사라졌으면 구멍만 남는다 — 통째로 버린다
  return reduced.length > 0 ? reduced : null;
}

console.log("downloading…");
const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
const source = await response.json();
console.log(`${source.features.length} features in`);

/** ADM0_A3 → 그 나라의 피처들. */
const byCountry = new Map();

for (const feature of source.features) {
  const { type, coordinates } = feature.geometry;

  const reduced =
    type === "Polygon"
      ? reducePolygon(coordinates)
      : type === "MultiPolygon"
        ? coordinates.map(reducePolygon).filter(Boolean)
        : null;
  if (!reduced || reduced.length === 0) continue;

  const country = feature.properties.adm0_a3;
  if (!country) continue;

  /**
   * 이름을 **평평하게** 넣는다. `{ names: { ko, en } }` 처럼 중첩하면
   * MapLibre 가 GeoJSON 을 내부 벡터 타일로 바꿀 때 스칼라만 살아남아서
   * 객체가 문자열로 뭉개진다.
   *
   * `name` 은 원어다 — 고른 언어와 영어가 둘 다 없을 때 마지막으로 떨어진다.
   */
  const properties = {
    // "KOR-1234". 구역을 가리키는 유일한 값이라 URL 키로 쓴다.
    id: feature.properties.adm1_code,
    // "KR-11" 같은 ISO 3166-2 코드. 표시·연동용이고 유일하지 않다.
    code: feature.properties.iso_3166_2,
    name: feature.properties.name,
  };
  for (const code of CODES) {
    const value = feature.properties[`name_${code}`];
    if (value) properties[`name_${code}`] = value;
  }

  const bucket = byCountry.get(country) ?? [];
  bucket.push({
    type: "Feature",
    properties,
    geometry: { type, coordinates: reduced },
  });
  byCountry.set(country, bucket);
}

// 스크립트를 다시 돌렸을 때 사라진 나라 파일이 남지 않도록 통째로 갈아엎는다
rmSync(DEST_DIR, { recursive: true, force: true });
mkdirSync(DEST_DIR, { recursive: true });

/**
 * 링 하나의 상자. MultiPolygon 이면 가장 넓은 조각만 쓸 수 있게 조각별로 낸다.
 */
function boxOf(rings) {
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < box[0]) box[0] = x;
      if (y < box[1]) box[1] = y;
      if (x > box[2]) box[2] = x;
      if (y > box[3]) box[3] = y;
    }
  }
  return box;
}

const merge = (a, b) => [
  Math.min(a[0], b[0]),
  Math.min(a[1], b[1]),
  Math.max(a[2], b[2]),
  Math.max(a[3], b[3]),
];

const area = (box) => (box[2] - box[0]) * (box[3] - box[1]);

const index = {};
let split = 0;

let bytes = 0;
for (const [country, features] of byCountry) {
  for (const feature of features) {
    const parts =
      feature.geometry.type === "Polygon"
        ? [boxOf(feature.geometry.coordinates)]
        : feature.geometry.coordinates.map(boxOf);

    const whole = parts.reduce(merge);
    /**
     * 경도 폭이 180도를 넘으면 날짜변경선을 걸친 것이다 — 알래스카처럼 조각이
     * 양 끝으로 갈라져서 상자가 지구를 한 바퀴 감싼다. 그대로 두면 Overpass 가
     * 전 세계를 훑는다. 그럴 때는 **가장 넓은 조각 하나**로 대신한다.
     */
    const box =
      whole[2] - whole[0] > 180
        ? parts.reduce((a, b) => (area(a) >= area(b) ? a : b))
        : whole;
    if (box !== whole) split++;

    // 이름이 통째로 없는 무명 구역이 있다. null 을 담으면 쓰는 쪽 타입이 깨진다.
    const names = {};
    if (feature.properties.name) names.local = feature.properties.name;
    for (const code of CODES) {
      const value = feature.properties[`name_${code}`];
      if (value) names[code] = value;
    }

    index[feature.properties.id] = {
      bbox: box.map((n) => Math.round(n * 1e4) / 1e4),
      names,
    };
  }

  const json = JSON.stringify({ type: "FeatureCollection", features });
  writeFileSync(new URL(`${country}.geojson`, DEST_DIR), json);
  bytes += json.length;
}

writeFileSync(INDEX_DEST, JSON.stringify(index));
console.log(
  `region-index ${Object.keys(index).length}개 (날짜변경선 때문에 최대 조각만 쓴 것 ${split}개)`,
);

console.log(
  `${byCountry.size} countries, ` +
    `${[...byCountry.values()].reduce((sum, f) => sum + f.length, 0)} features, ` +
    `${(bytes / 1024 / 1024).toFixed(1)} MB total`,
);
