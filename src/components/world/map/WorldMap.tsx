"use client";

import { MapLibreMap, setWorkerUrl } from "maplibre-gl";
import { useEffect, useRef } from "react";

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

export function WorldMap() {
  const containerRef = useRef<HTMLDivElement>(null);

  // 지도 인스턴스는 리렌더를 넘어 살아남아야 하므로 마운트 시 한 번만 만든다
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setWorkerUrl(WORKER_URL);

    const map = new MapLibreMap({
      container,
      style: STYLE_URL,
      center: [0, 20],
      zoom: 1,
    });

    map.on("load", () => {
      // 3D 지구본 투영. MapOptions 에는 없는 값이라 스타일이 로드된 뒤에 지정한다.
      // 데모 스타일의 globe.json 을 쓰는 대신 여기서 직접 지정해서,
      // 나중에 스타일을 갈아끼워도 지구본이 유지되게 한다.
      // (전환 순간은 인트로 커버에 가려서 보이지 않는다.)
      map.setProjection({ type: "globe" });
    });

    map.on("error", (event) => {
      console.error("[MapLibre]", event.error);
    });

    return () => map.remove();
  }, []);

  // absolute + inset-0 을 쓰면 안 된다 — MapLibre 가 컨테이너에 붙이는
  // `.maplibregl-map { position: relative }` 이 Tailwind 의 `.absolute` 를 덮어써서
  // (특이도 동일, 스타일시트 순서상 뒤) inset 이 무효가 되고 높이가 0 이 된다.
  // 높이를 명시적으로 잡아 위치잡기에 의존하지 않는다.
  // z-10 으로 별필드 위에 올린다. MapLibre 가 position:relative 를 강제하므로
  // z-index 는 그대로 먹는다.
  return <div ref={containerRef} className="relative z-10 h-full w-full" />;
}
