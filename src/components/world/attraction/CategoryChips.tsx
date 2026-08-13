"use client";

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
export function CategoryChips({ counts, total }: CategoryChipsProps) {
  const { language, category, setCategory } = useMapParams();
  const messages = messagesOf(language);

  // 분류가 하나뿐이면 고를 게 없다 — 자리만 차지한다
  if (counts.length < 2) return null;

  const chip = (active: boolean) =>
    `flex shrink-0 items-center gap-1.5 h-7 px-3 text-xs rounded-full transition-colors ${
      active
        ? "font-semibold text-black bg-white"
        : "text-white/60 bg-white/5 hover:bg-white/10 hover:text-white"
    }`;

  return (
    /**
     * 가로로 넘치면 스크롤한다. 줄바꿈으로 두면 분류가 많은 구역에서 칩이
     * 세 줄까지 쌓여 목록을 아래로 밀어낸다.
     */
    <div className="flex gap-1.5 px-5 pb-3 overflow-x-auto scrollbar-slim">
      <button
        type="button"
        aria-pressed={!category}
        onClick={() => setCategory(null)}
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
          onClick={() => setCategory(value)}
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
