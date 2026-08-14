import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { countryOf } from "@/lib/regions/code";

/**
 * 구역의 실제 모양. **명소가 그 구역 안에 있는지 가리는 데만 쓴다.**
 *
 * Overpass 는 상자로만 물어볼 수 있는데, 구역은 상자가 아니다 — 전 세계
 * 4584개 구역의 중앙값이 제 상자의 52% 밖에 안 채운다. 나머지 절반은 이웃
 * 땅이라, 상자만 믿으면 서울을 열었는데 부천 만화박물관과 남한산성이 섞인다
 * (실측 120건 중 16건).
 *
 * 지도가 이미 쓰고 있는 `public/admin1/{나라}.geojson` 을 그대로 읽는다.
 * 명소 조회는 하루 캐시라 이 파일을 자주 열지 않고, 가장 큰 나라도 1.1MB 다.
 */

/** 경계에서 이만큼 떨어진 곳까지는 안으로 본다(m). */
const TOLERANCE = 1000;

/** 위도 1도의 대략적인 길이(m). 경도는 위도에 따라 줄어서 따로 눌러 준다. */
const METERS_PER_DEGREE = 111_320;

/**
 * 들고 있을 구역 수의 상한. 뽑아 둔 링만 담지만 큰 구역은 정점이 수천 개라
 * 상한이 없으면 오래 뜬 서버에서 4584개가 그대로 쌓인다.
 */
const CACHE_LIMIT = 64;

type Position = [number, number];
/** 링 하나. 첫 번째가 바깥, 나머지는 구멍이다(전라남도 안의 광주처럼). */
type Ring = Position[];
type Poly = Ring[];

/** 안에 있는지 답하는 함수. 모양을 못 찾았으면 만들지 않는다. */
export type RegionShape = (lng: number, lat: number) => boolean;

const shapes = new Map<string, Poly[] | null>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isPosition = (value: unknown): value is Position =>
  Array.isArray(value) &&
  typeof value[0] === "number" &&
  typeof value[1] === "number";

const isRing = (value: unknown): value is Ring =>
  Array.isArray(value) && value.every(isPosition);

const isPoly = (value: unknown): value is Poly =>
  Array.isArray(value) && value.length > 0 && value.every(isRing);

/**
 * 구역의 판정 함수. **모양을 못 구하면 `null` 이다** — 그때는 거르지 않는다.
 * 걸러 낼 근거가 없는데 빈 목록을 주는 것보다 상자 그대로가 낫다.
 */
export function regionShape(region: string): RegionShape | null {
  const polys = polysOf(region);
  if (!polys) return null;

  return (lng, lat) => inside(polys, lng, lat) || near(polys, lng, lat);
}

function polysOf(region: string): Poly[] | null {
  const cached = shapes.get(region);
  // `null` 도 답이다 — 없는 것을 확인한 구역을 매번 다시 읽지 않는다
  if (cached !== undefined) return cached;

  const polys = readPolys(region);
  if (shapes.size >= CACHE_LIMIT) shapes.clear();
  shapes.set(region, polys);
  return polys;
}

/**
 * 나라 파일에서 구역 하나의 링만 꺼낸다.
 *
 * 파일 전체를 검사하지 않고 **찾은 구역만** 본다. 링 검사는 정점 하나하나를
 * 훑는 일이라, 나라 전체에 걸면 러시아에서 수십만 번이 헛돈다.
 */
function readPolys(region: string): Poly[] | null {
  try {
    const path = join(
      process.cwd(),
      "public",
      "admin1",
      `${countryOf(region)}.geojson`,
    );
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (!isRecord(parsed) || !Array.isArray(parsed.features)) return null;

    for (const feature of parsed.features) {
      if (!isRecord(feature)) continue;

      const { properties, geometry } = feature;
      if (!isRecord(properties) || properties.id !== region) continue;
      if (!isRecord(geometry)) return null;

      const { type, coordinates } = geometry;
      if (type === "Polygon" && isPoly(coordinates)) return [coordinates];
      if (
        type === "MultiPolygon" &&
        Array.isArray(coordinates) &&
        coordinates.every(isPoly)
      ) {
        return coordinates;
      }
      return null;
    }

    return null;
  } catch (error) {
    // 파일이 없거나 깨졌을 뿐이다. 명소 목록까지 버릴 이유가 없다.
    console.warn("[region-shape]", region, error);
    return null;
  }
}

/** 구멍은 빼고 본다 — 전라남도를 열었는데 광주 명소가 들어오면 안 된다. */
function inside(polys: Poly[], x: number, y: number) {
  return polys.some(
    (rings) =>
      inRing(rings[0], x, y) &&
      !rings.slice(1).some((hole) => inRing(hole, x, y)),
  );
}

/** 반직선을 그어 몇 번 넘는지 센다. 홀수면 안이다. */
function inRing(ring: Ring, x: number, y: number) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      hit = !hit;
    }
  }
  return hit;
}

/**
 * 경계에 붙어 있는 것은 살린다.
 *
 * **이 폴리곤은 지도에 그리려고 줄여 놓은 것이다.** 정점을 솎아 낸 만큼 선이
 * 실제 경계에서 몇백 미터씩 어긋나는데, 그대로 자르면 강 건너편도 아닌
 * 암사동 선사유적박물관이 서울 밖으로 떨어진다. 1km 를 봐주면 그런 것은
 * 남고 부천(15km)·남한산성(10km) 은 그대로 걸린다.
 */
function near(polys: Poly[], x: number, y: number) {
  // 경도 1도의 실제 폭은 위도가 올라갈수록 줄어든다 — 그만큼 눌러야 거리가 맞다
  const scale = Math.cos((y * Math.PI) / 180);
  const limit = TOLERANCE / METERS_PER_DEGREE;
  const limitSquared = limit * limit;

  for (const rings of polys) {
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        if (distanceSquared(x, y, ring[j], ring[i], scale) <= limitSquared) {
          return true;
        }
      }
    }
  }
  return false;
}

/** 점에서 선분까지의 거리². 점을 원점으로 옮겨 놓고 잰다. */
function distanceSquared(
  x: number,
  y: number,
  a: Position,
  b: Position,
  scale: number,
) {
  const ax = (a[0] - x) * scale;
  const ay = a[1] - y;
  const bx = (b[0] - x) * scale;
  const by = b[1] - y;

  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;

  // 선분 위에서 가장 가까운 점. 0~1 밖으로 나가면 양 끝점이 답이다.
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared));

  const px = ax + t * dx;
  const py = ay + t * dy;
  return px * px + py * py;
}
