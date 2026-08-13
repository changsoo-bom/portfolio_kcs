"use client";

import {
  FIT_DURATION,
  FIT_MAX_ZOOM,
  FIT_PADDING,
  PANEL_WIDTH,
  REGION_FIT_MAX_ZOOM,
  onMapReady,
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
 * 폭을 고정한다. select 는 내버려 두면 가장 긴 항목에 맞춰 늘어나서, 나라 칸과
 * 지역 칸이 서로 다른 폭이 되고 나라를 바꿀 때마다 그 폭이 또 달라진다.
 * 넘치는 이름은 잘라 낸다 — 어차피 펼치면 다 보인다.
 */
const FIELD =
  "h-9 w-44 cursor-pointer appearance-none truncate rounded-full bg-white/5 " +
  "pl-4 pr-8 text-sm text-white outline-none transition-colors " +
  "hover:bg-white/10 focus-visible:bg-white/10 disabled:cursor-default " +
  "disabled:text-white/25 disabled:hover:bg-white/5 " +
  // 목록은 OS 가 그린다 — 어두운 배경을 알려줘야 흰 판이 튀어나오지 않는다
  "[color-scheme:dark]";

/** 화살표. select 의 기본 화살표는 appearance-none 으로 지웠다. */
function Caret() {
  return (
    <svg
      viewBox="0 0 10 6"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-3 h-1.5 w-2.5 -translate-y-1/2 fill-white/40"
    >
      <path d="M0 0h10L5 6z" />
    </svg>
  );
}

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
    if (!target) return;

    onMapReady((map) => {
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
    });
  };

  return (
    <div className="fixed top-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 p-1.5 rounded-full border border-white/15 bg-black/60 backdrop-blur">
      <div className="relative">
        <select
          aria-label={messages.country}
          value={country ?? ""}
          onChange={(event) => setCountry(event.target.value || null)}
          className={FIELD}
        >
          <option value="">{messages.country}</option>
          {countries.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Caret />
      </div>

      <div className="relative">
        <select
          aria-label={messages.region}
          value={region ?? ""}
          disabled={regions.length === 0}
          onChange={(event) => setRegion(event.target.value || null)}
          className={FIELD}
        >
          <option value="">{messages.region}</option>
          {regions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Caret />
      </div>

      <button
        type="button"
        onClick={goTo}
        disabled={!target}
        className="flex items-center h-9 px-4 text-sm text-black bg-[#b6f5d5] rounded-full transition-colors hover:bg-white disabled:bg-white/10 disabled:text-white/25"
      >
        {messages.goTo}
      </button>
    </div>
  );
}
