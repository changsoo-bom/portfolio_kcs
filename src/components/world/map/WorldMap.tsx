"use client";

import { MapLibreMap, setWorkerUrl } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import "maplibre-gl/dist/maplibre-gl.css";

/**
 * 스타일은 MapLibre 가 제공하는 데모 타일이다 — API 키가 필요 없다.
 * 다만 **데모용 서버라 운영에는 쓰면 안 된다.** 배포 전에 자체 스타일이나
 * 다른 타일 제공자로 바꿔야 한다.
 */
const STYLE_URL = "https://demotiles.maplibre.org/style.json";

/**
 * MapLibre 는 Web Worker 를 쓰는데, 기본적으로 워커 URL 을 이렇게 만든다.
 *
 *   new URL("./maplibre-gl-worker.mjs", import.meta.url)
 *
 * 즉 **번들 청크 옆에 워커 파일이 그대로 있다고 가정한다.** Turbopack 은 그 파일을
 * 방출하지 않아서 요청이 404 HTML 로 떨어지고,
 * "Failed to load module script: non-JavaScript MIME type text/html" 로 죽는다.
 * (워커도 모듈 스크립트라 같은 메시지가 나온다.)
 *
 * 그래서 워커를 public/ 에서 직접 서빙하고 URL 을 명시한다.
 *
 * **워커 파일 하나만 복사하면 안 된다** — 워커가 `./maplibre-gl-shared.mjs` 를
 * 상대경로로 import 하므로 그것도 같은 디렉터리에 있어야 한다. 없으면 워커가 죽고,
 * 벡터 타일 파싱이 통째로 멈춰서 배경색만 칠해진 빈 지도가 나온다.
 *
 * 두 파일 모두 package.json 의 postinstall 이 node_modules 에서 복사해 버전을 맞춘다.
 */
const WORKER_URL = "/maplibre-gl-worker.mjs";

const INITIAL_CENTER: [number, number] = [0, 20];
/** 시작 배율. 올릴수록 지구가 크게 잡힌다. */
const INITIAL_ZOOM = 2;

/** 커서에 따라 지구가 밀리는 최대 거리(px). 화면 끝까지 갔을 때의 값이다. */
const PARALLAX_X = 18;
const PARALLAX_Y = 12;

/**
 * 지구본 팔레트 — "우주에 떠 있는 행성".
 *
 * 별하늘 배경(#0a0a24)이 청보라, 별빛이 민트·제이드다. 지구는 그보다 청록 쪽으로
 * 빼서 우주와 구분되게 하고, 해안선만 별과 같은 제이드로 밝혀 윤곽이 빛나 보이게 한다.
 */
const GLOBE = {
  /** 바다. 우주보다 밝아야 구체가 배경에서 떨어져 보인다. */
  ocean: "#1d4960",
  /** 대륙. 바다보다 한 단계 밝은 심록. */
  land: "#388582",
  /** 해안선. 별 팔레트의 제이드와 같은 색이다. */
  coast: "#5fe6a0",
  /** 나라 사이 경계. 해안선보다 훨씬 약하게 — 안 그러면 지구가 그물처럼 보인다. */
  border: "#62c0ac",
  /** 우주. 별하늘 배경과 같은 색이라 대기 후광이 자연스럽게 이어진다. */
  space: "#0a0a24",
  /** 대기 지평선. */
  horizon: "#369fbc",
} as const;

/** 호버한 나라를 덮는 레이어. 데모 스타일에 없는 우리 레이어다. */
const HOVER_LAYER = "country-hover";
/**
 * 어떤 나라도 고르지 않는 필터.
 *
 * 타일의 `fid` 는 0 부터 시작하는 양수라 -1 은 절대 맞지 않는다.
 * 레이어를 지웠다 다시 만드는 것보다 필터만 바꾸는 편이 훨씬 싸다.
 */
const NO_COUNTRY = -1;
/** 툴팁이 화면 오른쪽 끝에서 이만큼 안으로 들어오면 커서 왼쪽에 붙인다(px). */
const TOOLTIP_FLIP_EDGE = 200;

export function WorldMap() {
  /** 패럴랙스 변환이 걸리는 바깥 껍데기. 툴팁도 이 좌표계 안에 있다. */
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
      style: STYLE_URL,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });

    /**
     * 데모 스타일의 라벨(symbol) 레이어를 걷어낸다.
     *
     * 두 가지를 동시에 해결한다.
     * 1. 데모용 국가명 라벨은 우리 디자인에 필요 없다.
     * 2. 라벨을 그리려면 글리프 아틀라스를 GPU 에 올려야 하는데, 그 경로가
     *    `texSubImage2D(..., ALPHA, UNSIGNED_BYTE, data)` 로
     *    "Overload resolution failed" 를 내고 있었다. 라벨이 없으면 호출 자체가 없다.
     *
     * load 가 아니라 styledata 에서 지운다 — load 는 첫 렌더가 끝난 뒤라 이미 늦다.
     */
    const stripLabels = () => {
      for (const layer of map.getStyle().layers) {
        if (layer.type === "symbol") map.removeLayer(layer.id);
      }
    };
    map.on("styledata", stripLabels);

    map.on("load", () => {
      // 3D 지구본 투영. MapOptions 에는 없는 값이라 스타일이 로드된 뒤에 지정한다.
      // 데모 스타일의 globe.json 을 쓰는 대신 여기서 직접 지정해서,
      // 나중에 스타일을 갈아끼워도 지구본이 유지되게 한다.
      // (전환 순간은 인트로 커버에 가려서 보이지 않는다.)
      map.setProjection({ type: "globe" });

      // 데모 스타일 위에 우리 팔레트를 덮어쓴다.
      // 레이어 존재를 매번 확인한다 — 우리가 소유한 스타일이 아니라 언제든 바뀔 수 있다.
      // (setPaintProperty 의 키 타입이 재노출되지 않아 헬퍼로 감싸지 않고 그대로 부른다.)
      if (map.getLayer("background")) {
        map.setPaintProperty("background", "background-color", GLOBE.ocean);
      }
      if (map.getLayer("countries-fill")) {
        map.setPaintProperty("countries-fill", "fill-color", GLOBE.land);
      }
      if (map.getLayer("crimea-fill")) {
        map.setPaintProperty("crimea-fill", "fill-color", GLOBE.land);
      }
      if (map.getLayer("coastline")) {
        map.setPaintProperty("coastline", "line-color", GLOBE.coast);
        map.setPaintProperty("coastline", "line-width", 0.9);
        map.setPaintProperty("coastline", "line-opacity", 0.78);
      }
      if (map.getLayer("countries-boundary")) {
        map.setPaintProperty("countries-boundary", "line-color", GLOBE.border);
        map.setPaintProperty("countries-boundary", "line-width", 0.5);
        map.setPaintProperty("countries-boundary", "line-opacity", 0.45);
      }

      // 경위선 격자는 뺀다 — 앞서 choropleth 에서도 지웠던 것과 같은 판단이다
      if (map.getLayer("geolines")) map.removeLayer("geolines");

      /**
       * 대기 후광. 지구 가장자리가 은은하게 빛나면서 우주로 번진다.
       *
       * `fog-*` 는 넣지 않는다 — 스펙상 **3D 지형이 있어야 동작**하는 값이라
       * 우리 지도에서는 아무 일도 하지 않는다.
       *
       * `atmosphere-blend` 가 손잡이다 — 올릴수록 후광이 두꺼워지는데,
       * **너무 올리면 뒤의 별하늘을 덮어버린다.** 별이 흐려 보이면 이 값을 낮춘다.
       */
      map.setSky({
        "sky-color": GLOBE.space,
        "horizon-color": GLOBE.horizon,
        "sky-horizon-blend": 0.8,
        "atmosphere-blend": 0.35,
      });

      // ── 나라 호버
      // 데모 타일의 countries 레이어는 fid(고유 번호) · NAME · ADM0_A3 을 들고 있다.
      // feature-state 대신 필터를 쓴다 — 소스가 우리 것이 아니라 promoteId 를
      // 붙일 수 없고, fid 로 거르는 게 이름 비교보다 정확하다.
      if (!map.getLayer("countries-fill")) return;

      map.addLayer(
        {
          id: HOVER_LAYER,
          type: "fill",
          source: "maplibre",
          "source-layer": "countries",
          paint: {
            "fill-color": GLOBE.coast,
            "fill-opacity": 0.3,
            "fill-opacity-transition": { duration: 150, delay: 0 },
          },
          filter: ["==", ["get", "fid"], NO_COUNTRY],
        },
        // 해안선·국경선은 위에 남겨 윤곽이 덮이지 않게 한다
        map.getLayer("countries-boundary") ? "countries-boundary" : undefined,
      );

      const highlight = (fid: number) => {
        map.setFilter(HOVER_LAYER, ["==", ["get", "fid"], fid]);
      };

      /** 툴팁은 커서를 따라 계속 움직인다 — state 로 두면 리렌더가 폭주한다. */
      const moveTooltip = (point: { x: number; y: number }) => {
        const tooltip = tooltipRef.current;
        if (!tooltip) return;
        const flip = point.x > map.getCanvas().clientWidth - TOOLTIP_FLIP_EDGE;
        const offsetX = flip ? -16 : 16;
        tooltip.style.transform =
          `translate3d(${point.x + offsetX}px, ${point.y + 16}px, 0)` +
          (flip ? " translateX(-100%)" : "");
      };

      let hoveredFid: number | null = null;

      map.on("mousemove", "countries-fill", (event) => {
        const properties = event.features?.[0]?.properties;
        if (!properties) return;

        moveTooltip(event.point);

        const fid = typeof properties.fid === "number" ? properties.fid : null;
        if (fid === null || fid === hoveredFid) return;

        hoveredFid = fid;
        highlight(fid);
        setHoveredName(
          typeof properties.NAME === "string" ? properties.NAME : null,
        );
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "countries-fill", () => {
        hoveredFid = null;
        highlight(NO_COUNTRY);
        setHoveredName(null);
        map.getCanvas().style.cursor = "";
      });
    });

    map.on("error", (event) => {
      console.error("[MapLibre]", event.error);
    });

    return () => map.remove();
  }, []);

  /**
   * 커서를 따라 지구가 XY 로 조금씩 밀린다 — 별필드의 패럴랙스와 같은 성격이다.
   *
   * 지도 카메라(중심 좌표)를 건드리지 않고 **컨테이너를 CSS 로 옮긴다.** 그래서
   * 좌표계·드래그·줌과 아무 상관이 없고, MapLibre 를 다시 그리지도 않는다.
   * 이징은 CSS transition 이 처리하므로 애니메이션 루프도 필요 없다.
   *
   * 커서 반대 방향으로 움직인다 — 별필드에서 카메라가 커서 쪽으로 가면서
   * 별이 반대로 밀리는 것과 방향을 맞췄다.
   */
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      wrapper.style.transform = `translate3d(${-x * PARALLAX_X}px, ${-y * PARALLAX_Y}px, 0)`;
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      wrapper.style.transform = "";
    };
  }, []);

  return (
    // 껍데기가 패럴랙스와 좌표 기준을 맡는다. z-10 으로 별필드 위에 올린다.
    <div
      ref={wrapperRef}
      className="relative z-10 h-full w-full transition-transform duration-700 ease-out will-change-transform"
    >
      {/*
        지도 컨테이너에 absolute + inset-0 을 쓰면 안 된다 — MapLibre 가 붙이는
        `.maplibregl-map { position: relative }` 이 Tailwind 의 `.absolute` 를 덮어써서
        (특이도 동일, 스타일시트 순서상 뒤) inset 이 무효가 되고 높이가 0 이 된다.
        높이를 명시적으로 잡아 위치잡기에 의존하지 않는다.
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
