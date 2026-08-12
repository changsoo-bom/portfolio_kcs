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
 * 나라 실루엣. **데모 서버라 운영에는 쓰면 안 된다.**
 * 스키마: countries 레이어에 fid(Number) · NAME · ABBREV · ADM0_A3 · CONTINENT.
 *
 * 아래 상세 타일에는 **나라 폴리곤이 없어서**(OpenMapTiles 스키마에는 면이 물·녹지·
 * 건물뿐이다) 이걸 대체할 수 없다. 호버·클릭 판정이 이 레이어를 물고 있다.
 */
const TILES_URL = "https://demotiles.maplibre.org/tiles/tiles.json";
const SOURCE = "world";
const SOURCE_LAYER = "countries";
const FILL_LAYER = "country-fill";

/**
 * 상세 지형. OpenMapTiles 스키마, zoom 0–14, **API 키 없이** 쓴다.
 * 데이터는 OpenStreetMap(ODbL) — 저작자 표시가 의무라 attributionControl 을 켠다.
 */
const DETAIL_TILES = "https://tiles.openfreemap.org/planet";
const DETAIL = "detail";
const GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
/** 한글까지 들어 있는 폰트 스택. 별도 CJK 스택은 이 서버에 없다. */
const FONT = ["Noto Sans Regular"];

/**
 * 실루엣에서 지형으로 넘어가는 배율 구간.
 *
 * 이 아래는 demotiles 의 나라 면이 땅을 칠하고, 위로 올라가면 그게 사라지면서
 * 배경색이 땅색으로 바뀌고 그 위에 실제 물·녹지·도로가 올라온다. OpenMapTiles 에는
 * 땅 폴리곤이 없다 — **땅은 배경색이고 물이 그 위에 얹히는 구조**다.
 */
const DETAIL_FROM = 4;
const DETAIL_TO = 5.5;

const INITIAL_CENTER: [number, number] = [0, 20];
/** 시작 배율. 올릴수록 지구가 크게 잡힌다. */
const INITIAL_ZOOM = 2;

/** MapLibre 의 월드 크기(px). 지구본 반지름 계산에 쓴다. */
const TILE_SIZE = 512;

/** 툴팁이 화면 오른쪽 끝에서 이만큼 안으로 들어오면 커서 왼쪽에 붙인다(px). */
const TOOLTIP_FLIP_EDGE = 200;

/** 나라를 클릭했을 때 화면에 채우는 방식. 여백은 px, 지속시간은 ms. */
const FIT_PADDING = 96;
/** 룩셈부르크 같은 작은 나라에서 과하게 파고들지 않게 막는다. */
const FIT_MAX_ZOOM = 5.5;
const FIT_DURATION = 1600;

const DEG = Math.PI / 180;
/** 대원거리 코사인이 이보다 작으면 지구 뒤편으로 본다. 0.1 ≒ 84°. */
const BACKFACE_COS = 0.1;

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
  // ── 확대했을 때만 보이는 것들. 전부 땅색에서 갈라져 나온 톤이다.
  wood: "#2e7b70",
  grass: "#3f8f7c",
  sand: "#6f9a86",
  ice: "#cdeee8",
  road: "#a8ecc9",
  building: "#2b6b6a",
  label: "#eafff2",
  labelHalo: "#08303a",
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
      // OSM 데이터(ODbL)는 저작자 표시가 의무다. 끄면 안 된다 — compact 로 접어만 둔다.
      attributionControl: { compact: true },
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
        glyphs: GLYPHS,
        sources: {
          [SOURCE]: {
            type: "vector",
            url: TILES_URL,
            // 타일 피처에 id 가 없다. feature-state 를 쓰려면 속성을 id 로 승격해야 한다.
            promoteId: "fid",
          },
          [DETAIL]: { type: "vector", url: DETAIL_TILES },
        },
        layers: [
          {
            // 저배율에서는 바다, 고배율에서는 땅이다 — 위 DETAIL_FROM 주석 참고
            id: "ground",
            type: "background",
            paint: {
              "background-color": [
                "interpolate",
                ["linear"],
                ["zoom"],
                DETAIL_FROM,
                GLOBE.ocean,
                DETAIL_TO,
                GLOBE.land,
              ],
            },
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
              // 배경이 땅색을 넘겨받는 만큼 빠진다. maxzoom 을 주면 안 된다 —
              // 호버·클릭 판정이 이 레이어를 조회하므로 계속 살아 있어야 한다.
              "fill-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                DETAIL_FROM,
                1,
                DETAIL_TO,
                0,
              ],
            },
          },

          // ── 여기부터 상세 지형
          {
            id: "landcover",
            type: "fill",
            source: DETAIL,
            "source-layer": "landcover",
            minzoom: DETAIL_FROM,
            paint: {
              "fill-color": [
                "match",
                ["get", "class"],
                ["wood", "forest"],
                GLOBE.wood,
                ["grass", "farmland"],
                GLOBE.grass,
                ["sand", "rock"],
                GLOBE.sand,
                ["ice", "snow", "glacier"],
                GLOBE.ice,
                GLOBE.land,
              ],
              "fill-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                DETAIL_FROM,
                0,
                DETAIL_TO,
                0.55,
              ],
            },
          },
          {
            id: "park",
            type: "fill",
            source: DETAIL,
            "source-layer": "park",
            minzoom: 6,
            paint: { "fill-color": GLOBE.grass, "fill-opacity": 0.3 },
          },
          {
            id: "water",
            type: "fill",
            source: DETAIL,
            "source-layer": "water",
            minzoom: DETAIL_FROM,
            paint: {
              "fill-color": GLOBE.ocean,
              "fill-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                DETAIL_FROM,
                0,
                DETAIL_TO,
                1,
              ],
            },
          },
          {
            id: "waterway",
            type: "line",
            source: DETAIL,
            "source-layer": "waterway",
            minzoom: 7,
            paint: {
              "line-color": GLOBE.ocean,
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                7,
                0.5,
                14,
                2.5,
              ],
            },
          },
          // 작은 길이 큰 길 밑에 깔리도록 순서를 지킨다
          {
            id: "road-minor",
            type: "line",
            source: DETAIL,
            "source-layer": "transportation",
            minzoom: 11,
            filter: [
              "match",
              ["get", "class"],
              ["secondary", "tertiary", "minor", "service"],
              true,
              false,
            ],
            paint: {
              "line-color": GLOBE.road,
              "line-opacity": 0.28,
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                11,
                0.3,
                14,
                1.6,
              ],
            },
          },
          {
            id: "road",
            type: "line",
            source: DETAIL,
            "source-layer": "transportation",
            minzoom: 6,
            filter: [
              "match",
              ["get", "class"],
              ["motorway", "trunk", "primary"],
              true,
              false,
            ],
            paint: {
              "line-color": GLOBE.road,
              "line-opacity": 0.45,
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                6,
                0.4,
                14,
                3,
              ],
            },
          },
          {
            id: "building",
            type: "fill",
            source: DETAIL,
            "source-layer": "building",
            minzoom: 13,
            paint: { "fill-color": GLOBE.building, "fill-opacity": 0.7 },
          },
          /**
           * 행정 경계. demotiles 의 나라 윤곽은 저배율용이라 확대하면 실제 해안선과
           * 어긋나므로 아래에서 지워지고, 정확한 이쪽 선이 그 자리를 넘겨받는다.
           * admin_level 4 는 주·성·도 경계다 — 다음 단계 드릴다운의 기준선이 된다.
           */
          {
            id: "boundary-region",
            type: "line",
            source: DETAIL,
            "source-layer": "boundary",
            minzoom: 5,
            filter: [
              "all",
              ["==", ["get", "admin_level"], 4],
              ["!=", ["get", "maritime"], 1],
            ],
            paint: {
              "line-color": GLOBE.outline,
              "line-width": 0.8,
              "line-opacity": 0.3,
              "line-dasharray": [2, 2],
            },
          },
          {
            id: "boundary-country",
            type: "line",
            source: DETAIL,
            "source-layer": "boundary",
            minzoom: DETAIL_FROM,
            filter: [
              "all",
              ["==", ["get", "admin_level"], 2],
              ["!=", ["get", "maritime"], 1],
            ],
            paint: {
              "line-color": GLOBE.outline,
              "line-width": 1,
              "line-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                DETAIL_FROM,
                0,
                DETAIL_TO,
                0.8,
              ],
            },
          },

          // ── 저배율 전용 윤곽. 같은 도형을 굵고 흐리게 → 얇고 밝게 두 번 그려
          //    빛나 보이게 만든다. 확대하면 위 boundary 로 교대한다.
          {
            id: "country-glow",
            type: "line",
            source: SOURCE,
            "source-layer": SOURCE_LAYER,
            maxzoom: DETAIL_TO,
            paint: {
              "line-color": GLOBE.outline,
              "line-width": 2.4,
              "line-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                DETAIL_FROM,
                0.18,
                DETAIL_TO,
                0,
              ],
              "line-blur": 1.5,
            },
          },
          {
            id: "country-outline",
            type: "line",
            source: SOURCE,
            "source-layer": SOURCE_LAYER,
            maxzoom: DETAIL_TO,
            paint: {
              "line-color": GLOBE.outline,
              "line-width": 0.7,
              "line-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                DETAIL_FROM,
                0.7,
                DETAIL_TO,
                0,
              ],
            },
          },
          {
            id: "place-label",
            type: "symbol",
            source: DETAIL,
            "source-layer": "place",
            minzoom: DETAIL_FROM,
            filter: [
              "match",
              ["get", "class"],
              ["country", "state", "city", "town"],
              true,
              false,
            ],
            layout: {
              // 한국어 이름이 있으면 그걸 쓰고, 없으면 로마자 → 원어 순으로 떨어진다
              "text-field": [
                "coalesce",
                ["get", "name:ko"],
                ["get", "name:latin"],
                ["get", "name"],
              ],
              "text-font": FONT,
              "text-size": [
                "interpolate",
                ["linear"],
                ["zoom"],
                4,
                10,
                12,
                16,
              ],
              "text-max-width": 8,
              "text-padding": 4,
              // rank 가 작을수록 중요한 지명이다 — 겹칠 때 그쪽을 남긴다
              "symbol-sort-key": ["get", "rank"],
            },
            paint: {
              "text-color": GLOBE.label,
              "text-halo-color": GLOBE.labelHalo,
              "text-halo-width": 1.2,
              "text-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                DETAIL_FROM,
                0,
                DETAIL_TO,
                1,
              ],
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

    // ── 클릭 → 그 나라로 이동
    /**
     * 나라가 지금 화면에서 차지하는 픽셀 상자.
     *
     * **경위도 상자를 fitBounds 에 넘기면 안 된다.** fitBounds 는 상자를
     * 메르카토르 사각형으로 취급하는데, 러시아·캐나다처럼 고위도에 걸친 나라는
     * 메르카토르에서 세로로 폭발하고 경도 폭도 실제 호보다 크게 잡힌다.
     * 구면에서는 극 쪽이 오므라들어 훨씬 납작한데도 그 상자를 맞추느라
     * 필요 이상으로 줌아웃되고, 나라가 화면 위쪽에 작게 붙는다.
     *
     * 그려진 좌표를 화면으로 투영해서 재면 투영 방식과 무관해진다.
     * 날짜변경선 처리도 필요 없어진다 — 화면 좌표에는 경도 접합선이 없다.
     *
     * 벡터 타일은 나라를 타일 경계마다 잘라 두므로 같은 id 조각을 전부 모은다.
     */
    const screenBoxOf = (id: number, anchor: { lng: number; lat: number }) => {
      const center = map.getCenter();
      const centerLat = center.lat * DEG;
      const sinCenter = Math.sin(centerLat);
      const cosCenter = Math.cos(centerLat);

      /** 화면 중심에서의 대원거리 코사인. 1 이면 정면, 0 이면 림, 음수면 뒤편. */
      const cosFromCenter = (lng: number, lat: number) => {
        const latRad = lat * DEG;
        return (
          sinCenter * Math.sin(latRad) +
          cosCenter * Math.cos(latRad) * Math.cos((lng - center.lng) * DEG)
        );
      };

      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;

      for (const part of map.queryRenderedFeatures({ layers: [FILL_LAYER] })) {
        if (part.id !== id) continue;

        const { geometry } = part;
        const rings =
          geometry.type === "Polygon"
            ? geometry.coordinates
            : geometry.type === "MultiPolygon"
              ? geometry.coordinates.flat()
              : [];

        for (const ring of rings) {
          for (const [lng, lat] of ring) {
            /**
             * 지구 뒤편 좌표는 투영하면 앞면 좌표와 같은 자리에 찍혀 구분이 안 된다.
             * 림에 걸친 타일에는 양쪽 정점이 섞여 있어서 그대로 재면 상자가 부푼다.
             * 화면 중심에서 대원거리 90° 를 넘는 점은 버린다.
             */
            if (cosFromCenter(lng, lat) <= BACKFACE_COS) continue;

            const point = map.project([lng, lat]);
            if (point.x < left) left = point.x;
            if (point.x > right) right = point.x;
            if (point.y < top) top = point.y;
            if (point.y > bottom) bottom = point.y;
          }
        }
      }

      return left > right
        ? null
        : {
            left,
            top,
            right,
            bottom,
            /**
             * 클릭 지점의 정면도. 림 쪽 나라는 원근으로 눌려 보여서 실제보다
             * 작게 측정되는데, 가운데로 오면 그만큼 펴진다. 미리 되돌리지 않으면
             * 화면 가장자리 나라를 클릭할 때마다 과하게 파고든다.
             */
            foreshortening: Math.max(cosFromCenter(anchor.lng, anchor.lat), 0.2),
          };
    };

    map.on("click", (event) => {
      const { x, y } = event.point;
      if (!isOnGlobe(x, y)) return;

      const feature = map.queryRenderedFeatures([x, y], {
        layers: [FILL_LAYER],
      })[0];
      if (!feature || typeof feature.id !== "number") return;

      const box = screenBoxOf(feature.id, event.lngLat);
      // 조각을 못 찾으면(있을 리 없지만) 최소한 클릭한 지점은 가운데로 보낸다
      if (!box) {
        map.flyTo({
          center: event.lngLat,
          zoom: FIT_MAX_ZOOM,
          duration: FIT_DURATION,
        });
        return;
      }

      const canvas = map.getCanvas();
      // 1px 바닥은 0 나누기 방지용이다 — 아주 작은 나라는 어차피 상한에 걸린다
      const scale =
        Math.min(
          (canvas.clientWidth - FIT_PADDING * 2) /
            Math.max(box.right - box.left, 1),
          (canvas.clientHeight - FIT_PADDING * 2) /
            Math.max(box.bottom - box.top, 1),
        ) * box.foreshortening;

      map.flyTo({
        center: map.unproject([
          (box.left + box.right) / 2,
          (box.top + box.bottom) / 2,
        ]),
        // 배율은 2^zoom 에 비례하므로 로그를 취해 현재 배율에 더한다.
        // 음수는 자른다 — 나라를 클릭했는데 줌아웃되면 그게 제일 이상하다.
        zoom: Math.min(
          map.getZoom() + Math.max(Math.log2(scale), 0),
          FIT_MAX_ZOOM,
        ),
        duration: FIT_DURATION,
      });
    });

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
