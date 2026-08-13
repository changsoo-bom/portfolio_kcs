import type { AttractionCategory } from "@/types/attraction";

/**
 * 분류별 기호와 색조.
 *
 * **사진이 있는 쪽이 예외다** — 파리가 33%, 강원도가 4%다. 그래서 자리표시를
 * "사진을 못 불러온 상태"가 아니라 **분류를 보여주는 기본 상태**로 만든다.
 * 카드와 상세 모달이 같은 표를 써야 같은 장소가 같은 색으로 보인다.
 */
export const CATEGORY_LOOK: Record<
  AttractionCategory,
  { mark: string; tint: string }
> = {
  attraction: { mark: "◈", tint: "from-[#1d4960] to-[#0d2233]" },
  museum: { mark: "▣", tint: "from-[#3a3f6b] to-[#14162b]" },
  viewpoint: { mark: "▲", tint: "from-[#2e6b56] to-[#0f2620]" },
  theme_park: { mark: "◉", tint: "from-[#6b3a5c] to-[#25121f]" },
  zoo: { mark: "❋", tint: "from-[#4a6b2e] to-[#1a2610]" },
  aquarium: { mark: "≋", tint: "from-[#2e5a6b] to-[#101f26]" },
  artwork: { mark: "✦", tint: "from-[#6b5a2e] to-[#261f10]" },
  gallery: { mark: "◫", tint: "from-[#5a3a6b] to-[#1f1226]" },
};

export const CATEGORY_LABEL: Record<AttractionCategory, string> = {
  attraction: "명소",
  museum: "박물관",
  viewpoint: "전망",
  theme_park: "테마파크",
  zoo: "동물원",
  aquarium: "아쿠아리움",
  artwork: "조형물",
  gallery: "갤러리",
};
