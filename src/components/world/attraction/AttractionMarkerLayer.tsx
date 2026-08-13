"use client";

import { GeoJSONSource } from "maplibre-gl";
import { useEffect } from "react";

import {
  NO_PLACES,
  PLACE_SOURCE,
  onMapReady,
} from "@/components/world/map/map-instance";
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

    // 구역을 닫으면 이 컴포넌트가 사라진다 — 점도 같이 걷는다
    return () => {
      off();
      attached?.setData(NO_PLACES);
    };
  }, [points]);

  return null;
}
