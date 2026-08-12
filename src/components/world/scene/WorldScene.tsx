"use client";

import { WorldMap } from "@/components/world/map/WorldMap";
import { Starfield } from "@/components/world/scene/Starfield";

/**
 * 별필드(아래) + 지도(위) 합성.
 *
 * MapLibre 는 컨텍스트를 alpha:true 로 만들고 clearColor 기본값이 투명이라,
 * 지구 바깥이 뚫려서 뒤의 별이 그대로 비친다.
 *
 * 정면 광원을 흉내내려고 화면 전체에 원형 그라디언트를 얹었다가 뺐다.
 * 별하늘 배경이 검정이 아니라 #0a0a24 라서, screen 이든 soft-light 든
 * 그라디언트가 닿는 만큼 배경이 들려 별이 뿌예진다.
 * 다시 시도한다면 오버레이를 **지구 반경 안에 들어가는 픽셀 크기**로 제한해야 한다.
 */
export function WorldScene() {
  return (
    <div className="relative h-full w-full">
      <Starfield />
      <WorldMap />
    </div>
  );
}
