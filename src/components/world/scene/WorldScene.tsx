"use client";

import { WorldMap } from "@/components/world/map/WorldMap";
import { Starfield } from "@/components/world/scene/Starfield";

/**
 * 화면을 향한 면이 빛을 받는 것처럼 보이게 하는 하이라이트.
 *
 * MapLibre 지구본은 표면 조명을 제공하지 않아서 어느 각도든 균일하게 칠해진다.
 * 그래서 평평하고 그늘진 인상이 남는다. 지도 위에 중심이 밝고 가장자리로
 * 사라지는 원형 그라디언트를 screen 으로 합성해 정면 광원을 흉내낸다.
 *
 * 62% 지점에서 완전히 투명해지므로 화면 가장자리의 별하늘은 건드리지 않는다.
 * 조명 위치를 살짝 위(46%)로 둔 건 위에서 비치는 느낌이 더 자연스럽기 때문이다.
 */
const GLOBE_LIGHT =
  "radial-gradient(circle at 50% 46%, rgba(150, 240, 220, 0.20) 0%, rgba(90, 190, 200, 0.10) 32%, rgba(60, 140, 170, 0.04) 48%, transparent 62%)";

/**
 * 별필드(아래) + 지도(위) 합성.
 *
 * MapLibre 는 컨텍스트를 alpha:true 로 만들고 clearColor 기본값이 투명이라,
 * 지구 바깥이 뚫려서 뒤의 별이 그대로 비친다.
 */
export function WorldScene() {
  return (
    <div className="relative h-full w-full">
      <Starfield />
      <WorldMap />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 mix-blend-screen"
        style={{ background: GLOBE_LIGHT }}
      />
    </div>
  );
}
