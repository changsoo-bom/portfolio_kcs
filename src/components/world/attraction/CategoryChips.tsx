"use client";

import { useEffect, useRef } from "react";

import { CATEGORY_LOOK } from "@/constants/attraction-look";
import { messagesOf } from "@/constants/messages";
import { useMapParams } from "@/hooks/use-map-params";
import type { AttractionCategory } from "@/types/attraction";

type CategoryChipsProps = {
  /** 이 구역에 실제로 있는 분류와 개수. 없는 분류는 아예 오지 않는다. */
  counts: { category: AttractionCategory; count: number }[];
  total: number;
};

/**
 * 분류 칩. **누르는 일만 맡는다** — 무엇을 보여줄지는 서버가 정한다.
 *
 * 고른 값이 주소에 남아서 목록·개수·지도 마커가 **한 번에** 같이 걸러진다.
 * 셋이 같은 조회를 타기 때문에, 여기서 하는 일은 주소를 바꾸는 것뿐이다.
 */
/** 이만큼 넘게 밀었으면 고른 게 아니라 민 것이다(px). */
const DRAG_SLOP = 4;

export function CategoryChips({ counts, total }: CategoryChipsProps) {
  const { language, category, setCategory } = useMapParams();
  const messages = messagesOf(language);
  const trackRef = useRef<HTMLDivElement>(null);

  /**
   * 미는 중인지. **state 로 두면 미는 동안 칩이 매 프레임 다시 그려진다** —
   * 필요한 건 화면이 아니라 scrollLeft 하나라서 ref 에 담는다.
   */
  const drag = useRef({
    active: false,
    startX: 0,
    startLeft: 0,
    moved: 0,
    captured: false,
  });

  /** 양 끝에 닿았는지에 따라 흐림을 켜고 끈다. */
  const syncEdges = () => {
    const track = trackRef.current;
    if (!track) return;

    const max = track.scrollWidth - track.clientWidth;
    // 1px 여유 — 브라우저마다 끝값이 소수점으로 떨어져서 딱 비교하면 안 꺼진다
    if (track.scrollLeft > 1) track.dataset.fadeStart = "";
    else delete track.dataset.fadeStart;

    if (track.scrollLeft < max - 1) track.dataset.fadeEnd = "";
    else delete track.dataset.fadeEnd;
  };

  // 처음 그려질 때와 분류가 바뀔 때 한 번씩 — 넘치지 않으면 흐림도 없다
  useEffect(syncEdges, [counts]);

  // 분류가 하나뿐이면 고를 게 없다 — 자리만 차지한다
  if (counts.length < 2) return null;

  const chip = (active: boolean) =>
    `flex shrink-0 items-center gap-1.5 h-7 px-3 text-xs rounded-full transition-colors ${
      active
        ? "font-semibold text-black bg-white"
        : "text-white/60 bg-white/5 hover:bg-white/10 hover:text-white"
    }`;

  /** 민 거리가 이 문턱을 넘었으면 그 클릭은 고르기가 아니다. */
  const pick = (value: string | null) => {
    if (drag.current.moved > DRAG_SLOP) return;
    setCategory(value);
  };

  return (
    /**
     * 가로로 넘치면 **잡아끌어 민다.** 줄바꿈으로 두면 분류가 많은 구역에서
     * 칩이 세 줄까지 쌓여 목록을 아래로 밀어낸다.
     *
     * 손가락은 브라우저가 알아서 밀어 주고 관성까지 붙는다 — 그래서 마우스만
     * 여기서 처리한다. 터치까지 가로채면 그 관성을 우리가 다시 만들어야 한다.
     */
    <div
      ref={trackRef}
      onScroll={syncEdges}
      onPointerDown={(event) => {
        const track = trackRef.current;
        if (!track || event.pointerType !== "mouse") return;

        drag.current = {
          active: true,
          startX: event.clientX,
          startLeft: track.scrollLeft,
          moved: 0,
          captured: false,
        };
        /**
         * **여기서 포인터를 잡으면 칩 클릭이 죽는다.**
         *
         * 캡처가 걸리면 이어지는 click 이 칩 버튼이 아니라 이 띠에서 발생해서
         * 버튼의 onClick 이 아예 안 불린다 — 미는 것만 되고 고르기가 안 된다.
         * 그래서 실제로 밀기 시작한 뒤(아래)에 잡는다.
         */
      }}
      onPointerMove={(event) => {
        const track = trackRef.current;
        if (!track || !drag.current.active) return;

        const dx = event.clientX - drag.current.startX;
        drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));

        // 문턱을 넘어 확실히 미는 중일 때만 잡는다. 그래야 띠 밖으로 커서가
        // 나가도 따라오면서, 제자리 클릭은 칩까지 그대로 간다.
        if (!drag.current.captured && drag.current.moved > DRAG_SLOP) {
          track.setPointerCapture(event.pointerId);
          drag.current.captured = true;
        }

        track.scrollLeft = drag.current.startLeft - dx;
      }}
      onPointerUp={(event) => {
        drag.current.active = false;
        if (!drag.current.captured) return;

        drag.current.captured = false;
        trackRef.current?.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        drag.current.active = false;
      }}
      className="flex gap-1.5 px-5 pt-3 pb-3 overflow-x-auto chip-track cursor-grab active:cursor-grabbing"
    >
      <button
        type="button"
        aria-pressed={!category}
        onClick={() => pick(null)}
        className={chip(!category)}
      >
        {messages.all}
        <span className="tabular-nums opacity-60">{total}</span>
      </button>

      {counts.map(({ category: value, count }) => (
        <button
          key={value}
          type="button"
          aria-pressed={category === value}
          onClick={() => pick(value)}
          className={chip(category === value)}
        >
          <span aria-hidden="true">{CATEGORY_LOOK[value].mark}</span>
          {messages.categories[value]}
          <span className="tabular-nums opacity-60">{count}</span>
        </button>
      ))}
    </div>
  );
}
