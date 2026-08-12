"use client";

import type { RefObject } from "react";

type ZoomControlProps = {
  /** 0% 에 해당하는 배율. */
  min: number;
  /** 100% 에 해당하는 배율. */
  max: number;
  /**
   * 슬라이더와 퍼센트 표시는 **지도가 직접 갱신한다.**
   *
   * 휠·핀치·나라 클릭으로도 배율이 바뀌는데, 그걸 전부 state 로 받으면
   * 줌 애니메이션 한 번에 리렌더가 수십 번 돈다. 지도 쪽 effect 가
   * 이 ref 들에 값을 써넣는다.
   */
  sliderRef: RefObject<HTMLInputElement | null>;
  percentRef: RefObject<HTMLSpanElement | null>;
  onSlide: (zoom: number) => void;
  onStep: (direction: 1 | -1) => void;
};

const BUTTON =
  "flex items-center justify-center w-6 h-6 text-base leading-none text-white/70 " +
  "rounded-full transition-colors hover:bg-white/10 hover:text-white";

export function ZoomControl({
  min,
  max,
  sliderRef,
  percentRef,
  onSlide,
  onStep,
}: ZoomControlProps) {
  return (
    <div className="fixed top-6 left-6 z-20 flex flex-col items-center gap-2 rounded-full border border-white/15 bg-black/60 px-2 py-3 backdrop-blur">
      <button
        type="button"
        aria-label="확대"
        onClick={() => onStep(1)}
        className={BUTTON}
      >
        +
      </button>

      {/*
        세로 슬라이더는 writing-mode 로 만든다. `appearance: slider-vertical` 은
        폐기됐고 표준 방식이 이것이다.

        vertical-lr 만 주면 **작은 값이 위로** 간다 — 확대가 아래가 되어 손이
        반대로 움직인다. direction: rtl 로 뒤집어 큰 값을 위로 올린다.
      */}
      <input
        ref={sliderRef}
        type="range"
        aria-label="지도 배율"
        min={min}
        max={max}
        // 배율 자체를 값으로 쓴다 — 퍼센트로 변환하면 양쪽에서 두 번 왕복한다
        step={0.01}
        defaultValue={min}
        onChange={(event) => onSlide(event.currentTarget.valueAsNumber)}
        className="h-32 w-4 cursor-pointer accent-[#5fe6a0] [direction:rtl] [writing-mode:vertical-lr]"
      />

      <button
        type="button"
        aria-label="축소"
        onClick={() => onStep(-1)}
        className={BUTTON}
      >
        &minus;
      </button>

      <span
        ref={percentRef}
        className="w-9 text-center font-mono text-xs tabular-nums text-white/70"
      >
        0%
      </span>
    </div>
  );
}
