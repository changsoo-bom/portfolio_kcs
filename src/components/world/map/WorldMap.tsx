"use client";

import { MapLibreMap, setWorkerUrl } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import "maplibre-gl/dist/maplibre-gl.css";

/**
 * MapLibre 는 Web Worker 를 쓰는데, 기본적으로 워커 URL 을 이렇게 만든다.
 *
 *   new URL("./maplibre-gl-worker.mjs", import.meta.url)
 *
 * 즉 **번들 청크 옆에 워커 파일이 그대로 있다고 가정한다.** Turbopack 은 그 파일을
 * 방출하지 않아서 요청이 404 HTML 로 떨어지고,
 * "Failed to load module script: non-JavaScript MIME type text/html" 로 죽는다.
 *
 * **워커 파일 하나만 복사하면 안 된다** — 워커가 `./maplibre-gl-shared.mjs` 를
 * 상대경로로 import 하므로 그것도 같은 디렉터리에 있어야 한다. 없으면 워커가 죽고,
 * 벡터 타일 파싱이 통째로 멈춰서 배경색만 칠해진 빈 지도가 나온다.
 *
 * 두 파일 모두 package.json 의 postinstall 이 node_modules 에서 복사해 버전을 맞춘다.
 */
const WORKER_URL = "/maplibre-gl-worker.mjs";

/**
 * 타일 출처. **데모 서버라 운영에는 쓰면 안 된다.**
 * 스키마: countries 레이어에 fid(Number) · NAME · ABBREV · ADM0_A3 · CONTINENT.
 */
const TILES_URL = "https://demotiles.maplibre.org/tiles/tiles.json";
const SOURCE = "world";
const SOURCE_LAYER = "countries";
const FILL_LAYER = "country-fill";

const INITIAL_CENTER: [number, number] = [0, 20];
/** 시작 배율. 올릴수록 지구가 크게 잡힌다. */
const INITIAL_ZOOM = 2;

/** MapLibre 의 월드 크기(px). 지구본 반지름 계산에 쓴다. */
const TILE_SIZE = 512;

/** 툴팁이 화면 오른쪽 끝에서 이만큼 안으로 들어오면 커서 왼쪽에 붙인다(px). */
const TOOLTIP_FLIP_EDGE = 200;

/**
 * 지구본 팔레트 — "우주에 떠 있는 행성".
 *
 * 별하늘 배경(#0a0a24)이 청보라, 별빛이 민트·제이드다. 지구는 그보다 청록 쪽으로
 * 빼서 우주와 구분되게 하고, 윤곽만 별과 같은 제이드로 밝혀 빛나 보이게 한다.
 */
const GLOBE = {
  ocean: "#1d4960",
  land: "#388582",
  /** 호버한 나라. 대륙보다 밝고 제이드 쪽으로 기울인다. */
  hover: "#4aa892",
  /** 윤곽선. 별 팔레트의 제이드와 같은 색이다. */
  outline: "#5fe6a0",
  space: "#0a0a24",
  horizon: "#369fbc",
} as const;

export function WorldMap() {
  /** 좌표 기준이 되는 껍데기. 툴팁이 지도와 같은 좌표계 안에 있어야 한다. */
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  // 지도 인스턴스는 리렌더를 넘어 살아남아야 하므로 마운트 시 한 번만 만든다
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setWorkerUrl(WORKER_URL);

    const map = new MapLibreMap({
      container,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: false,
      /**
       * 데모 스타일을 덮어쓰지 않고 **직접 정의한다.**
       *
       * 그래야 소스에 `promoteId` 를 붙일 수 있고, 그게 있어야 feature-state 로
       * 호버를 칠할 수 있다. 앞서 쓰던 setFilter 방식은 나라가 바뀔 때마다
       * 레이어 전체를 다시 평가하고 렌더 버킷을 재구성해서 눈에 띄게 버벅였다.
       *
       * 덤으로 라벨 제거·팔레트 덮어쓰기 같은 방어 코드가 전부 사라진다.
       */
      style: {
        version: 8,
        projection: { type: "globe" },
        sky: {
          "sky-color": GLOBE.space,
          "horizon-color": GLOBE.horizon,
          "sky-horizon-blend": 0.8,
          // 올릴수록 후광이 두꺼워지는데, 너무 올리면 뒤의 별하늘을 덮는다
          "atmosphere-blend": 0.35,
        },
        sources: {
          [SOURCE]: {
            type: "vector",
            url: TILES_URL,
            // 타일 피처에 id 가 없다. feature-state 를 쓰려면 속성을 id 로 승격해야 한다.
            promoteId: "fid",
          },
        },
        layers: [
          {
            id: "ocean",
            type: "background",
            paint: { "background-color": GLOBE.ocean },
          },
          {
            id: FILL_LAYER,
            type: "fill",
            source: SOURCE,
            "source-layer": SOURCE_LAYER,
            paint: {
              "fill-color": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                GLOBE.hover,
                GLOBE.land,
              ],
              "fill-color-transition": { duration: 160, delay: 0 },
            },
          },
          // 같은 도형을 굵고 흐리게 → 얇고 밝게 두 번 그려 윤곽이 빛나게 만든다
          {
            id: "country-glow",
            type: "line",
            source: SOURCE,
            "source-layer": SOURCE_LAYER,
            paint: {
              "line-color": GLOBE.outline,
              "line-width": 2.4,
              "line-opacity": 0.18,
              "line-blur": 1.5,
            },
          },
          {
            id: "country-outline",
            type: "line",
            source: SOURCE,
            "source-layer": SOURCE_LAYER,
            paint: {
              "line-color": GLOBE.outline,
              "line-width": 0.7,
              "line-opacity": 0.7,
            },
          },
        ],
      },
    });

    // ── 호버
    let hoveredId: number | null = null;
    // event.point 는 Point 클래스라 PointLike 튜플로 옮겨 담는다
    let pendingPoint: [number, number] | null = null;
    let hoverFrame = 0;

    /**
     * 화면 좌표가 지구본 원 안에 있는지.
     *
     * 지구 바깥에서도 queryRenderedFeatures 가 나라를 돌려준다 — 구 실루엣 밖의
     * 점이 평면으로 투영되기 때문이다. 반지름으로 직접 걸러낸다.
     * 적도 둘레가 곧 월드 크기라 반지름은 worldSize / 2π 다.
     */
    const isOnGlobe = (x: number, y: number) => {
      const radius = (TILE_SIZE * 2 ** map.getZoom()) / (2 * Math.PI);
      const center = map.project(map.getCenter());
      return Math.hypot(x - center.x, y - center.y) <= radius;
    };

    const clearHover = () => {
      if (hoveredId === null) return;
      map.removeFeatureState({
        source: SOURCE,
        sourceLayer: SOURCE_LAYER,
        id: hoveredId,
      });
      hoveredId = null;
      setHoveredName(null);
      map.getCanvas().style.cursor = "";
    };

    /** 툴팁은 커서를 따라 계속 움직인다 — state 로 두면 리렌더가 폭주한다. */
    const moveTooltip = (x: number, y: number) => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;
      const flip = x > map.getCanvas().clientWidth - TOOLTIP_FLIP_EDGE;
      tooltip.style.transform =
        `translate3d(${x + (flip ? -16 : 16)}px, ${y + 16}px, 0)` +
        (flip ? " translateX(-100%)" : "");
    };

    /**
     * 프레임당 한 번만 판정한다.
     *
     * `map.on("mousemove", "레이어", ...)` 를 쓰면 MapLibre 가 마우스 이벤트마다
     * queryRenderedFeatures 를 돌린다. 좌표만 쌓아두고 마지막 것 하나만 조회한다.
     */
    const resolveHover = () => {
      hoverFrame = 0;
      const point = pendingPoint;
      pendingPoint = null;
      if (!point) return;

      if (!isOnGlobe(point[0], point[1])) {
        clearHover();
        return;
      }

      const feature = map.queryRenderedFeatures(point, {
        layers: [FILL_LAYER],
      })[0];

      if (!feature || typeof feature.id !== "number") {
        clearHover();
        return;
      }

      moveTooltip(point[0], point[1]);
      if (feature.id === hoveredId) return;

      if (hoveredId !== null) {
        map.removeFeatureState({
          source: SOURCE,
          sourceLayer: SOURCE_LAYER,
          id: hoveredId,
        });
      }
      hoveredId = feature.id;
      map.setFeatureState(
        { source: SOURCE, sourceLayer: SOURCE_LAYER, id: hoveredId },
        { hover: true },
      );

      const name = feature.properties.NAME;
      setHoveredName(typeof name === "string" ? name : null);
      map.getCanvas().style.cursor = "pointer";
    };

    map.on("mousemove", (event) => {
      pendingPoint = [event.point.x, event.point.y];
      if (!hoverFrame) hoverFrame = requestAnimationFrame(resolveHover);
    });
    map.on("mouseout", clearHover);

    map.on("error", (event) => {
      console.error("[MapLibre]", event.error);
    });

    return () => {
      cancelAnimationFrame(hoverFrame);
      map.remove();
    };
  }, []);

  return (
    // z-10 으로 별필드 위에 올린다.
    // 커서를 따라 지도를 CSS 로 밀던 패럴랙스는 뺐다 — 지도가 커서 밑에서
    // 미끄러지는 동안 호버 판정이 낡은 위치를 가리켜서, 지구 바깥인데도
    // 엉뚱한 나라가 잡혔다. 장식보다 호버 정확도가 우선이다.
    <div ref={wrapperRef} className="relative z-10 h-full w-full">
      {/*
        지도 컨테이너에 absolute + inset-0 을 쓰면 안 된다 — MapLibre 가 붙이는
        `.maplibregl-map { position: relative }` 이 Tailwind 의 `.absolute` 를 덮어써서
        inset 이 무효가 되고 높이가 0 이 된다. 높이를 명시적으로 잡는다.
      */}
      <div ref={containerRef} className="h-full w-full" />

      {/*
        조건부 렌더가 아니라 항상 두고 투명도만 바꾼다 — 조건부면 첫 호버 때
        ref 가 아직 없어서 위치를 못 잡고 좌상단에 한 프레임 튄다.
      */}
      <div
        ref={tooltipRef}
        aria-hidden="true"
        className={`pointer-events-none absolute top-0 left-0 rounded-full border border-white/15 bg-black/70 px-4 py-1.5 font-mono text-xs tracking-[0.2em] whitespace-nowrap text-white backdrop-blur transition-opacity duration-150 ${
          hoveredName ? "opacity-100" : "opacity-0"
        }`}
      >
        {hoveredName}
      </div>
    </div>
  );
}
