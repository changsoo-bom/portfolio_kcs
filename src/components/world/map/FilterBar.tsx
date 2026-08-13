"use client";

import { RotateCcw, Send } from "lucide-react";

import { Dropdown } from "@/components/ui/Dropdown";
import {
  FIT_DURATION,
  FIT_MAX_ZOOM,
  FIT_PADDING,
  PANEL_WIDTH,
  REGION_FIT_MAX_ZOOM,
  mapInstance,
} from "@/components/world/map/map-instance";
import { messagesOf } from "@/constants/messages";
import { useMapParams } from "@/hooks/use-map-params";
import type { RegionOption } from "@/lib/regions";
import type { RegionBounds } from "@/types/attraction";

type FilterBarProps = {
  countries: RegionOption[];
  /** 고른 나라의 구역들. 나라를 안 골랐으면 빈 배열이다. */
  regions: RegionOption[];
  /** 바로가기가 데려갈 곳. 구역을 골랐으면 구역, 아니면 나라 전체. */
  target: RegionBounds | null;
};

/**
 * 화면 위쪽 가운데의 나라·구역 필터.
 *
 * **목록은 서버가 그려서 내려준다.** 나라 240개와 구역 4584개의 이름표는
 * 1.3MB 라 클라이언트로 보낼 물건이 아니다. 고른 값도 주소에 있어서, 지도를
 * 눌러 고르든 여기서 고르든 같은 곳을 본다 — 한쪽이 다른 쪽을 따라가게
 * 맞추는 코드가 필요 없다.
 *
 * 고르는 것과 가는 것을 갈라 뒀다. 고르기만 하면 화면은 그대로고, 바로가기를
 * 눌러야 지도가 움직인다.
 */
export function FilterBar({ countries, regions, target }: FilterBarProps) {
  const { language, country, region, setCountry, setRegion } = useMapParams();
  const messages = messagesOf(language);

  const goTo = () => {
    const map = mapInstance();
    if (!target || !map) return;

    const width = map.getCanvas().clientWidth;
    // 패널이 열려 있으면 그만큼은 보이는 화면이 아니다
    const covered = region && width > PANEL_WIDTH * 2 ? PANEL_WIDTH : 0;

    map.fitBounds(
      [
        [target.west, target.south],
        [target.east, target.north],
      ],
      {
        padding: {
          top: FIT_PADDING,
          bottom: FIT_PADDING,
          left: FIT_PADDING,
          right: FIT_PADDING + covered,
        },
        maxZoom: region ? REGION_FIT_MAX_ZOOM : FIT_MAX_ZOOM,
        duration: FIT_DURATION,
      },
    );
  };

  /**
   * 고른 것을 다 지우고 지구본으로 돌아간다.
   *
   * 나라를 지우면 그 안에서 고른 구역과 열어 둔 장소도 같이 지워진다 —
   * 다른 나라의 구역이 남아 있을 자리가 없어서 훅이 그렇게 묶어 놨다.
   */
  const reset = () => {
    setCountry(null);
    const map = mapInstance();
    map?.easeTo({ zoom: map.getMinZoom(), duration: FIT_DURATION });
  };

  return (
    <div className="fixed top-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 p-1.5 rounded-full border border-white/15 bg-black/60 backdrop-blur">
      <Dropdown
        label={messages.country}
        value={country}
        options={countries}
        language={language}
        onChange={setCountry}
      />

      <Dropdown
        label={messages.region}
        value={region}
        options={regions}
        disabled={regions.length === 0}
        language={language}
        onChange={setRegion}
      />

      {/* 되돌리기는 뒤에 숨는 색으로 — 눌러야 할 버튼은 옆의 흰 것이다 */}
      <button
        type="button"
        aria-label={messages.reset}
        title={messages.reset}
        onClick={reset}
        className="flex items-center justify-center h-9 w-9 text-white/60 bg-white/5 rounded-full transition-colors hover:bg-white/10 hover:text-white"
      >
        <RotateCcw className="h-4 w-4" />
      </button>

      {/*
        글자 대신 종이비행기. 옆의 두 칸이 200px 씩이라 여기까지 글자가 붙으면
        막대가 길어지고, 무엇보다 이건 **고르는 칸이 아니라 실행 버튼**이라
        모양이 달라야 눈에 갈린다. 이름은 aria-label 로 남는다.
      */}
      <button
        type="button"
        aria-label={messages.goTo}
        title={messages.goTo}
        onClick={goTo}
        disabled={!target}
        className="flex items-center justify-center h-9 w-9 text-black bg-white rounded-full transition-colors hover:bg-white/75 disabled:bg-white/10 disabled:text-white/25"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
