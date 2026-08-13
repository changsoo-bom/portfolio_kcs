"use client";

import type { MapLibreMap } from "maplibre-gl";

/**
 * 살아 있는 지도 인스턴스 하나를 붙잡아 둔다.
 *
 * 명소 마커는 **서버가 그린 트리에서 온다** — 목록과 같은 조회를 타야 하니까.
 * 그래서 지도 컴포넌트의 자식이 아니고, props 로도 context 로도 닿지 않는다.
 *
 * 지도가 먼저 생길 수도 있고 마커가 먼저 마운트될 수도 있어서 대기 목록을 둔다.
 * 자식 effect 가 부모보다 먼저 도는 React 규칙 때문에, 주소로 바로 들어온
 * 경우에는 마커 쪽이 항상 먼저다.
 */
let instance: MapLibreMap | null = null;
const waiting = new Set<(map: MapLibreMap) => void>();

export function setMapInstance(next: MapLibreMap | null) {
  instance = next;
  if (!next) return;
  for (const listener of waiting) listener(next);
  waiting.clear();
}

/** 지도가 준비되면 부른다. 이미 준비됐으면 그 자리에서 부른다. */
export function onMapReady(listener: (map: MapLibreMap) => void) {
  if (instance) {
    listener(instance);
    return () => {};
  }
  waiting.add(listener);
  return () => {
    waiting.delete(listener);
  };
}

/**
 * 구역을 화면에 채우는 방식. 여백은 px, 지속시간은 ms.
 *
 * 지도를 눌러 들어갈 때와 위쪽 필터에서 바로가기로 갈 때가 **같은 자리에
 * 도착해야 해서** 여기 둔다. 값이 갈라지면 두 경로가 다른 화면을 만든다.
 */
export const FIT_PADDING = 96;
export const FIT_DURATION = 1600;
/** 룩셈부르크 같은 작은 나라에서 과하게 파고들지 않게 막는다. */
export const FIT_MAX_ZOOM = 5.5;
/**
 * 지역을 눌렀을 때의 상한. 나라보다 높아야 한 단계 더 들어가는 게 된다.
 *
 * 지역 레이어가 꺼지는 배율(9)보다 살짝 아래로 잡았다 — 딱 그 값으로 가면
 * 도착하는 순간 레이어가 꺼져서 방금 고른 것이 하이라이트도 안 되고
 * 다시 누를 수도 없다.
 */
export const REGION_FIT_MAX_ZOOM = 8.5;

/**
 * 명소 패널이 화면 오른쪽에서 가리는 폭(px).
 *
 * 지도는 자기 캔버스 전체를 기준으로 구역을 맞추기 때문에, 패널이 덮는 만큼을
 * 빼 주지 않으면 방금 고른 구역이 패널 밑에 반쯤 깔린다.
 * **`AttractionPanelShell` 의 `max-w-[22rem]` 과 같아야 한다** — Tailwind 클래스는
 * 빌드 때 문자열로 훑어서 이 값을 끼워 넣을 수 없다.
 */
export const PANEL_WIDTH = 352;

/** 명소 마커 소스. 스타일에 빈 채로 선언해 두고 여기에 데이터만 갈아끼운다. */
export const PLACE_SOURCE = "place";
export const PLACE_MARKER = "place-marker";
export const PLACE_MARKER_LABEL = "place-marker-label";

export const NO_PLACES = {
  type: "FeatureCollection",
  features: [],
} as const;
