"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { messagesOf } from "@/constants/messages";
import { useMapParams } from "@/hooks/use-map-params";

type AttractionPanelShellProps = {
  title: string;
  /** 개수도 조회가 끝나야 나온다 — 셀 때까지 기다리는 표시를 대신 받는다. */
  count: ReactNode;
  children: ReactNode;
};

/**
 * 패널의 껍데기. 내용은 서버가 만들고 **닫기만 클라이언트가 맡는다.**
 *
 * 목록을 통째로 클라이언트 컴포넌트로 만들면 Overpass 결과가 전부 직렬화되어
 * 브라우저로 넘어간다. 닫기 버튼 하나 때문에 그럴 이유가 없어서, 서버가 만든
 * 목록을 children 으로 받아 감싸기만 한다.
 *
 * **껍데기는 기다림 밖에 있다.** 안에 있으면 목록이 도착할 때 통째로 새로
 * 붙어서, 등장 애니메이션이 몇 초 뒤에 한 번 더 돈다.
 *
 * 닫을 때는 표시만 먼저 바꾸고 애니메이션이 끝난 뒤에 주소를 바꾼다 —
 * 주소를 먼저 바꾸면 패널이 그 자리에서 사라져 걸 대상이 없다.
 */
export function AttractionPanelShell({
  title,
  count,
  children,
}: AttractionPanelShellProps) {
  const { language, setRegion } = useMapParams();
  const [closing, setClosing] = useState(false);

  return (
    <aside
      /*
        currentTarget 비교는 안쪽 스켈레톤·카드의 애니메이션이 올라와
        먼저 닫아버리는 걸 막는다.
      */
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) setRegion(null);
      }}
      // max-w-[22rem] 은 WorldMap 의 PANEL_WIDTH 와 짝이다 — 지도가 구역을
      // 화면에 맞출 때 이 폭만큼 빼고 계산한다
      className={`fixed top-0 right-0 z-20 flex flex-col h-dvh w-full max-w-[22rem] border-l border-white/10 bg-black/80 backdrop-blur ${
        closing ? "animate-panel-out" : "animate-panel-in"
      }`}
    >
      <header className="flex items-start justify-between gap-3 px-5 pt-6 pb-4 border-b border-white/10">
        <div className="min-w-0">
          <h2 className="text-lg text-white truncate">{title}</h2>
          <p className="mt-0.5 font-mono text-[10px] tracking-[0.2em] text-white/40">
            {count}
          </p>
        </div>

        <button
          type="button"
          aria-label={messagesOf(language).close}
          onClick={() => setClosing(true)}
          className="flex items-center justify-center shrink-0 h-8 w-8 text-white/50 rounded-full transition-colors hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      </header>

      {/* 목록만 스크롤한다 — 제목은 붙어 있어야 어느 구역인지 잃지 않는다 */}
      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-slim">
        {children}
      </div>
    </aside>
  );
}
