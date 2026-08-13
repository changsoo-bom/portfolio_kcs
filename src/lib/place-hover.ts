"use client";

/**
 * 지금 가리키고 있는 명소 하나를 목록과 지도가 나눠 본다.
 *
 * 둘은 트리에서 만나지 않는다 — 목록은 패널 안, 마커는 지도 소스 안이고
 * 그 사이에 서버 컴포넌트가 끼어 있어서 props 로도 context 로도 닿지 않는다.
 * 그래서 `map-instance` 와 같은 방식으로 모듈 하나에 얹어 둔다.
 *
 * **Zustand 를 안 쓴 이유**: 리렌더가 필요 없다. 이 값이 바뀌면 지도는
 * feature-state 를, 목록은 DOM 속성을 직접 건드린다. 커서를 따라 초당 수십
 * 번 바뀌는 값을 React 상태로 올리면 카드 84장이 그때마다 다시 그려진다.
 */

/** 어디서 가리켰는지. **이걸 안 나누면 서로 되받아 무한히 돈다.** */
export type HoverSource = "map" | "list";

type Listener = (id: string | null, from: HoverSource) => void;

let hovered: string | null = null;
let hoveredFrom: HoverSource | null = null;
const listeners = new Set<Listener>();

/**
 * 같은 것을 같은 쪽에서 다시 알리는 것만 접는다.
 *
 * **어디서 왔는지까지 봐야 한다.** id 만 비교하면, 목록에서 가리키던 카드를
 * 지도에서 이어 가리킬 때 그 통지가 통째로 삼켜진다 — 두 리스너가 하는 일이
 * 서로 달라서 한쪽은 아직 모르는 상태다.
 */
export function setHoveredPlace(id: string | null, from: HoverSource) {
  if (hovered === id && hoveredFrom === from) return;

  hovered = id;
  hoveredFrom = from;
  for (const listener of listeners) listener(id, from);
}

export function onHoveredPlace(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
