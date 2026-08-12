"use client";

import { WorldMap } from "@/components/world/map/WorldMap";
import { Starfield } from "@/components/world/scene/Starfield";

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
    </div>
  );
}
