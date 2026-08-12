"use client";

import { GeoJSONSource, MapLibreMap, setWorkerUrl } from "maplibre-gl";
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

/**
 * 지구 표면은 **처음부터 끝까지 위성 사진이다.** 벡터 소스가 하는 일은
 * 사진 위에 얹는 것뿐 — 도로·행정경계·지명, 그리고 호버 판정용 면이다.
 *
 * 그래서 위 구간은 이제 지형이 아니라 **주기(annotation)가 올라오는 구간**이다.
 */

/**
 * 위성 사진. Sentinel-2 cloudless (EOX).
 *
 * **비상업 한정이다** — CC BY-NC-SA 4.0. 이 프로젝트에는 맞지만 상업 전환 시
 * 교체해야 한다. 대안은 MapTiler Satellite(키 필요, 무료 100k 타일/월).
 * Esri World Imagery 는 키 없이 열리지만 직접 타일 호출이 약관 밖이라 쓰지 않는다.
 *
 * 격자는 GoogleMapsCompatible 이고 경로가 {z}/{행}/{열} 순이라 y 가 x 보다 앞에 온다.
 * 실해상도가 10m/px 이라 14 위로는 확대해도 새 정보가 없다 — 거기서 끊고
 * MapLibre 가 늘려 쓰게 둔다.
 */
const SATELLITE = "satellite";
const SATELLITE_TILES =
  "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2025_3857/default/g/{z}/{y}/{x}.jpg";
const SATELLITE_MAX_ZOOM = 14;

/**
 * 행정구역(admin-1) 면. `scripts/build-admin1.mjs` 가 만든다.
 *
 * 위 상세 타일에는 **행정구역 면이 없다** — boundary 는 선이라 호버로 칠할
 * 대상이 되지 못한다. 그래서 Natural Earth 폴리곤을 따로 얹는다.
 *
 * 전 세계가 한 파일이면 간소화 후에도 11MB 라 나라별로 쪼개 두고,
 * 화면 가운데 나라가 바뀔 때 그 나라 것만 받는다.
 */
const REGION = "region";
const REGION_FILL = "region-fill";
const REGION_URL = (country: string) => `/admin1/${country}.geojson`;
/**
 * 지역 면은 1:10m 을 간소화한 데이터라 확대할수록 화면에 그려지는
 * OpenStreetMap 경계선과 벌어진다. 그 전에 손을 뗀다.
 */
const REGION_MAX_ZOOM = 9;
/** 아직 아무 나라도 안 골랐을 때의 초기값. */
const NO_REGIONS = { type: "FeatureCollection", features: [] } as const;

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
/**
 * 역할마다 색을 갈랐다. 겹쳐 그려도 무엇이 무엇인지 구분된다.
 *   경계선 = 흰색 / 호버 = 제이드 / 도로 = 크림
 *
 * **경계선만 무채색인 게 핵심이다.** 지구본에서 손을 떼면 화면에 색이 있는 건
 * 사진과 호버뿐이라, 커서를 올린 곳이 유일하게 색을 띤 영역이 된다.
 *
 * 색 있는 경계선(제이드·시안)을 둘 다 거쳐 봤는데, 제이드는 식생 초록과
 * 색상이 가까워 삼림 위에서 묻히고 시안은 눈에 너무 세게 박혔다.
 * 흰색은 사진 어디에서도 중간은 가고, 무엇보다 호버와 경쟁하지 않는다.
 */
const GLOBE = {
  /** 사진 타일이 도착하기 전 구를 채우는 색. 우주색에 붙여 둬야 덜 튄다. */
  ocean: "#0d2233",
  space: "#0a0a24",
  horizon: "#369fbc",

  line: "#ffffff",
  /** 별 팔레트의 제이드. 화면에서 유일하게 색을 띤 UI 요소다. */
  hover: "#b6f5d5",
  /** 경계선과 싸우지 않게 반대편으로 뺐다. */
  road: "#ffe3b0",
  label: "#eafff2",
  /** 사진은 밝은 데가 많다. 할로가 어두워야 글자가 버틴다. */
  labelHalo: "#04121a",
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
          [SATELLITE]: {
            type: "raster",
            tiles: [SATELLITE_TILES],
            tileSize: 256,
            maxzoom: SATELLITE_MAX_ZOOM,
            // CC BY-NC-SA 4.0 의 표시 의무를 이걸로 채운다
            attribution:
              '<a href="https://s2maps.eu">Sentinel-2 cloudless</a> by ' +
              '<a href="https://eox.at">EOX</a> (CC BY-NC-SA 4.0)',
          },
          [REGION]: {
            type: "geojson",
            data: NO_REGIONS,
            // 파일에 id 가 없다. feature-state 로 호버를 칠하려면 필요하다.
            generateId: true,
          },
        },
        layers: [
          {
            // 사진 타일이 도착하기 전까지 구를 채워 두는 색이다
            id: "ground",
            type: "background",
            paint: { "background-color": GLOBE.ocean },
          },
          {
            id: "satellite",
            type: "raster",
            source: SATELLITE,
            paint: { "raster-opacity": 1 },
          },
          /**
           * 나라 호버 대상. **사진을 가리면 안 되므로 평소에는 완전히 투명하다.**
           * 투명해도 조회는 된다 — queryRenderedFeatures 는 배율 범위와 visibility
           * 만 보고 불투명도는 따지지 않는다. 호버·클릭 판정이 전부 이 레이어를 탄다.
           */
          {
            id: FILL_LAYER,
            type: "fill",
            source: SOURCE,
            "source-layer": SOURCE_LAYER,
            paint: {
              "fill-color": GLOBE.hover,
              /**
               * 지역 레이어가 꺼지는 배율 위로는 색도 끊는다. 나라 하나가 이미
               * 화면을 다 채우고 있어서, 칠하면 화면 전체가 물든다.
               * 레이어 자체는 계속 살려 둔다 — 조회 경로가 여기를 탄다.
               *
               * **step 이 바깥이어야 한다.** `["zoom"]` 은 최상위 step/interpolate 의
               * 입력으로만 쓸 수 있어서, case 안에 넣으면 paint 파싱이 실패하고
               * 스타일 로드가 통째로 엎어진다 — 레이어가 하나도 안 남는다.
               */
              "fill-opacity": [
                "step",
                ["zoom"],
                [
                  "case",
                  ["boolean", ["feature-state", "hover"], false],
                  0.28,
                  0,
                ],
                REGION_MAX_ZOOM,
                0,
              ],
              "fill-opacity-transition": { duration: 160, delay: 0 },
            },
          },

          // ── 여기부터 사진 위에 얹는 주기(annotation)
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
              "line-opacity": 0.22,
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
              "line-opacity": 0.4,
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
          /**
           * 행정 경계. demotiles 의 나라 윤곽은 저배율용이라 확대하면 실제 해안선과
           * 어긋나므로 아래에서 지워지고, 정확한 이쪽 선이 그 자리를 넘겨받는다.
           * admin_level 4 는 주·성·도 경계다 — 다음 단계 드릴다운의 기준선이 된다.
           */
          /**
           * 호버 대상. 평소에는 완전히 투명하고 커서가 올라간 것만 칠해진다.
           * 투명해도 조회는 된다 — queryRenderedFeatures 는 배율 범위와
           * visibility 만 보고 불투명도는 따지지 않는다.
           */
          {
            id: REGION_FILL,
            type: "fill",
            source: REGION,
            minzoom: DETAIL_FROM,
            maxzoom: REGION_MAX_ZOOM,
            paint: {
              "fill-color": GLOBE.hover,
              // 지역은 나라보다 좁아서 조금 더 진해야 같은 세기로 읽힌다
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                0.34,
                0,
              ],
              "fill-opacity-transition": { duration: 160, delay: 0 },
            },
          },
          {
            id: "boundary-region",
            type: "line",
            source: DETAIL,
            "source-layer": "boundary",
            minzoom: DETAIL_FROM,
            filter: [
              "all",
              ["==", ["get", "admin_level"], 4],
              ["!=", ["get", "maritime"], 1],
            ],
            paint: {
              "line-color": GLOBE.line,
              "line-width": 1.1,
              // 나라 경계와 같은 구간에서 같이 떠오른다
              "line-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                DETAIL_FROM,
                0,
                DETAIL_TO,
                0.55,
              ],
              // 나라 경계(실선)와 구분되게 점선을 유지하되 간격을 좁힌다
              "line-dasharray": [3, 1.5],
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
              "line-color": GLOBE.line,
              "line-width": 1.2,
              "line-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                DETAIL_FROM,
                0,
                DETAIL_TO,
                0.85,
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
              "text-halo-width": 1.5,
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
    /**
     * 지금 칠해 둔 대상. 나라와 지역이 서로 다른 소스라 id 만으로는 구분이 안 된다
     * — 둘 다 작은 정수라 값이 겹친다. 소스까지 들고 다녀야 한다.
     *
     * setFeatureState / removeFeatureState 가 받는 모양과 같아서 그대로 넘긴다.
     */
    let hovered: { source: string; sourceLayer?: string; id: number } | null =
      null;
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

    /**
     * 조회할 레이어. **없는 id 를 넘기면 MapLibre 가 에러를 뿜고 빈 배열을 준다.**
     * 스타일이 앉기 전에 mousemove 가 들어오면 아직 아무 레이어도 없고,
     * region-fill 은 나라를 고르기 전이라도 존재하지만 순서상 먼저 걸린다.
     */
    const hoverLayers = () =>
      [REGION_FILL, FILL_LAYER].filter((id) => map.getLayer(id));

    const clearHover = () => {
      if (!hovered) return;
      map.removeFeatureState(hovered);
      hovered = null;
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

      /**
       * 지역 면이 나라 면 위에 있어서 먼저 나온다 — 결과는 레이어 배열 순서가
       * 아니라 **그리는 순서(위부터)** 로 돌아온다. 지역이 없거나 배율 밖이면
       * 자동으로 빠지므로 나라로 떨어진다.
       */
      const feature = map.queryRenderedFeatures(point, {
        layers: hoverLayers(),
      })[0];

      if (!feature || typeof feature.id !== "number") {
        clearHover();
        return;
      }

      moveTooltip(point[0], point[1]);

      const isRegion = feature.layer.id === REGION_FILL;
      const next = isRegion
        ? { source: REGION, id: feature.id }
        : { source: SOURCE, sourceLayer: SOURCE_LAYER, id: feature.id };

      if (hovered?.source === next.source && hovered.id === next.id) return;

      if (hovered) map.removeFeatureState(hovered);
      hovered = next;
      map.setFeatureState(hovered, { hover: true });

      const { properties } = feature;
      const name = isRegion
        ? (properties.name_ko ?? properties.name)
        : properties.NAME;
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
        layers: hoverLayers(),
      })[0];
      if (!feature || typeof feature.id !== "number") return;
      // 지역 위에서 누른 거면 나라를 다시 맞추지 않는다 — 이미 들어와 있는데
      // 나라 전체로 되돌리면 오히려 줌아웃된다
      if (feature.layer.id === REGION_FILL) return;

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

    // ── 화면 가운데 나라의 행정구역을 받아 둔다
    let loadedCountry: string | null = null;

    /**
     * 클릭으로 날아왔든 직접 줌했든 같은 경로를 탄다 — **화면 한가운데에 있는
     * 나라**를 기준으로 삼는다. idle 은 타일까지 다 앉은 뒤에 오므로 그 시점에는
     * 가운데 조회가 빈손으로 돌아오지 않는다.
     */
    const syncRegions = async () => {
      const source = map.getSource(REGION);
      if (!(source instanceof GeoJSONSource)) return;
      if (map.getZoom() < DETAIL_FROM) return;

      const canvas = map.getCanvas();
      const middle: [number, number] = [
        canvas.clientWidth / 2,
        canvas.clientHeight / 2,
      ];
      const country = map.queryRenderedFeatures(middle, {
        layers: [FILL_LAYER],
      })[0]?.properties.ADM0_A3;

      if (typeof country !== "string" || country === loadedCountry) return;
      loadedCountry = country;

      // 행정구역 자료가 없는 나라도 있다 — 404 면 조용히 비운다
      const response = await fetch(REGION_URL(country));
      // 기다리는 사이 다른 나라로 넘어갔으면 늦게 온 응답이 덮어쓰지 않게 버린다
      if (loadedCountry !== country) return;

      // generateId 는 데이터를 갈아끼울 때 id 를 새로 매긴다 — 칠해 둔 채로 두면
      // 없어진 id 를 가리켜서 하이라이트가 박힌다
      clearHover();
      source.setData(response.ok ? await response.json() : NO_REGIONS);
    };

    map.on("idle", syncRegions);

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
