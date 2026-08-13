"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { onHoveredPlace, setHoveredPlace } from "@/lib/place-hover";

/**
 * 목록과 지도의 손짓을 잇는다.
 *
 * 카드에 커서를 올리면 지도의 그 점이 커지고, 지도의 점에 올리면 그 카드가
 * 목록에서 밝아지며 보이는 자리로 스크롤된다.
 *
 * **카드는 서버 컴포넌트로 남는다.** 카드마다 클라이언트 경계를 두면 목록
 * 전체가 브라우저로 넘어가는데, 필요한 건 이벤트 하나뿐이다. 그래서 이
 * 껍데기가 위임으로 받고 카드는 `data-place` 만 달고 있는다.
 *
 * 강조도 클래스가 아니라 `data-active` 로 건다 — 이 파일이 클래스 문자열을
 * 조립하면 Tailwind 가 빌드 때 그걸 못 보고 스타일을 안 만든다.
 */
export function AttractionHoverBridge({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      onHoveredPlace((id, from) => {
        // 목록에서 시작한 것은 목록이 이미 알고 있다
        if (from !== "map") return;

        const root = rootRef.current;
        if (!root) return;

        for (const card of root.querySelectorAll("[data-active]")) {
          if (card instanceof HTMLElement) delete card.dataset.active;
        }
        if (!id) return;

        // id 에 슬래시가 들어간다("node/123") — 선택자로 쓰려면 escape 가 필요하다
        const target = root.querySelector(`[data-place="${CSS.escape(id)}"]`);
        if (!(target instanceof HTMLElement)) return;

        target.dataset.active = "";
        // nearest — 이미 보이는 카드는 건드리지 않는다. 그래야 화면이 안 튄다.
        target.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }),
    [],
  );

  return (
    <div
      ref={rootRef}
      onPointerOver={(event) => {
        const card =
          event.target instanceof Element
            ? event.target.closest("[data-place]")
            : null;
        if (card instanceof HTMLElement) {
          setHoveredPlace(card.dataset.place ?? null, "list");
        }
      }}
      // 목록을 벗어나면 끈다. pointerout 은 카드 사이를 지날 때마다 와서 깜빡인다.
      onPointerLeave={() => setHoveredPlace(null, "list")}
    >
      {children}
    </div>
  );
}
