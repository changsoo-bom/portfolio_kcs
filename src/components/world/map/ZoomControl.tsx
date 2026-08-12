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

/**
 * 세로 슬라이더 모양.
 *
 * **엘리먼트 폭을 키워도 트랙은 굵어지지 않는다** — 네이티브 트랙 두께는
 * 폭과 무관해서 늘린 만큼 여백만 생긴다. appearance-none 으로 기본 모양을
 * 끄고 의사요소를 직접 잡아야 한다. 대신 그 순간부터 thumb 도 안 그려지므로
 * 함께 그려줘야 한다.
 *
 * 두 가지를 지킨다.
 *
 * **트랙에 블록축 크기(h-full)를 준다.** 세로 모드에서 폭만 주면 높이가 0 으로
 * 접혀 트랙이 아예 안 보이고 thumb 만 떠 있다.
 *
 * **thumb 은 트랙과 교차축 굵기를 맞추고 진행축으로만 길게 뺀다.** 굵기를
 * 다르게 하면 가운데로 옮기는 음수 마진이 필요한데, 세로 쓰기 모드에서 그
 * 기준축이 브라우저마다 달라 한쪽에서 어긋난다. 길이만 늘리면 그 문제가 없다.
 */
const SLIDER = [
  "h-28 w-10 cursor-pointer appearance-none bg-transparent",
  "[direction:rtl] [writing-mode:vertical-lr]",
  "[&::-webkit-slider-runnable-track]:h-full [&::-webkit-slider-runnable-track]:w-3 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-white/15",
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#b6f5d5]",
  "[&::-moz-range-track]:h-full [&::-moz-range-track]:w-3 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-white/15",
  "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#b6f5d5]",
].join(" ");

export function ZoomControl({
  min,
  max,
  sliderRef,
  percentRef,
  onSlide,
  onStep,
}: ZoomControlProps) {
  return (
    // 폭을 톱니바퀴 버튼(w-10)과 맞춰 한 줄로 읽히게 한다.
    // 화면 고정은 부모가 한다 — 설정 버튼과 세로로 붙어 있어야 해서.
    <div className="flex flex-col items-center gap-0.5 w-10 py-1.5 rounded-full border border-white/15 bg-black/60 backdrop-blur">
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
        className={SLIDER}
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
        className="w-full text-center font-mono text-[10px] tabular-nums text-white/70"
      >
        0%
      </span>
    </div>
  );
}
