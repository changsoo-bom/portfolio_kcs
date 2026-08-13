"use client";

import { GeoJSONSource } from "maplibre-gl";
import { useEffect } from "react";

import {
  NO_PLACES,
  PLACE_SOURCE,
  mapInstance,
  onMapReady,
} from "@/components/world/map/map-instance";
import { onHoveredPlace, setHoveredPlace } from "@/lib/place-hover";
import type { AttractionPoint } from "@/types/attraction";

/**
 * 명소를 지도 위의 점으로 올린다. **화면에는 아무것도 안 그린다** —
 * 그리는 건 MapLibre 고, 이 컴포넌트는 소스에 데이터를 넣었다 빼는 일만 한다.
 *
 * 마커를 DOM 으로 얹지 않은 이유는 지구본이기 때문이다. 100개 넘는 절대위치
 * 요소를 매 프레임 다시 투영하면 회전이 끊긴다. 소스에 넣으면 GPU 가 그린다.
 */
export function AttractionMarkerLayer({
  points,
}: {
  points: AttractionPoint[];
}) {
  useEffect(() => {
    const data = {
      type: "FeatureCollection" as const,
      features: points.map((point, index) => ({
        type: "Feature" as const,
        // feature-state 는 숫자 id 를 받는다. OSM id("node/123")는 속성으로 둔다.
        id: index,
        geometry: {
          type: "Point" as const,
          coordinates: [point.lng, point.lat],
        },
        properties: { id: point.id, name: point.name },
      })),
    };

    let attached: GeoJSONSource | null = null;

    const off = onMapReady((map) => {
      const source = map.getSource(PLACE_SOURCE);
      if (!(source instanceof GeoJSONSource)) return;
      attached = source;
      source.setData(data);
    });

    /**
     * 목록에서 카드를 가리키면 그 점을 키운다.
     *
     * 지도에서 시작한 호버는 지도가 이미 칠하고 있다 — 여기서 또 칠하면
     * 두 곳이 같은 상태를 두고 다투다가 커서를 뗀 뒤에도 하나가 남는다.
     *
     * 소스의 feature id 는 위에서 매긴 순번이라 OSM id 로 되짚을 표가 필요하다.
     */
    const order = new Map(points.map((point, index) => [point.id, index]));
    let painted: number | null = null;

    const paint = (index: number | null) => {
      const map = mapInstance();
      if (!map || !map.getSource(PLACE_SOURCE)) return;

      if (painted !== null) {
        map.removeFeatureState({ source: PLACE_SOURCE, id: painted });
      }
      painted = index;
      if (index !== null) {
        map.setFeatureState({ source: PLACE_SOURCE, id: index }, { hover: true });
      }
    };

    const offHover = onHoveredPlace((id, from) => {
      if (from !== "list") return;
      paint(id === null ? null : (order.get(id) ?? null));
    });

    // 구역을 닫으면 이 컴포넌트가 사라진다 — 점도 같이 걷는다
    return () => {
      off();
      offHover();
      paint(null);
      /**
       * 가리키던 것도 놓는다. 이 표를 안 지우면 다음 목록에서 **같은 명소**를
       * 가리켜도 "이미 그것" 으로 보고 넘겨서 점이 영영 안 커진다 —
       * 칠은 위에서 풀렸는데 알림만 남은 상태다.
       */
      setHoveredPlace(null, "list");
      attached?.setData(NO_PLACES);
    };
  }, [points]);

  return null;
}
