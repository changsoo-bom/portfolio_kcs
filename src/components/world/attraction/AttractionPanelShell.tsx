"use client";

import type { ReactNode } from "react";

import { useMapParams } from "@/hooks/use-map-params";

type AttractionPanelShellProps = {
  title: string;
  /** 아직 세지 못했으면 넘기지 않는다 — 기다리는 동안 "0 PLACES" 가 뜨면 안 된다. */
  count?: number;
  children: ReactNode;
};

/**
 * 패널의 껍데기. 내용은 서버가 만들고 **닫기만 클라이언트가 맡는다.**
 *
 * 목록을 통째로 클라이언트 컴포넌트로 만들면 Overpass 결과가 전부 직렬화되어
 * 브라우저로 넘어간다. 닫기 버튼 하나 때문에 그럴 이유가 없어서, 서버가 만든
 * 목록을 children 으로 받아 감싸기만 한다.
 */
export function AttractionPanelShell({
  title,
  count,
  children,
}: AttractionPanelShellProps) {
  const { setRegion } = useMapParams();

  return (
    <aside className="fixed top-0 right-0 z-20 flex flex-col h-dvh w-full max-w-[22rem] border-l border-white/10 bg-black/80 backdrop-blur">
      <header className="flex items-start justify-between gap-3 px-5 pt-6 pb-4 border-b border-white/10">
        <div className="min-w-0">
          <h2 className="text-lg text-white truncate">{title}</h2>
          <p className="mt-0.5 font-mono text-[10px] tracking-[0.2em] text-white/40">
            {count === undefined ? "SEARCHING…" : `${count} PLACES`}
          </p>
        </div>

        <button
          type="button"
          aria-label="닫기"
          onClick={() => setRegion(null)}
          className="flex items-center justify-center shrink-0 h-8 w-8 text-white/50 rounded-full transition-colors hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      </header>

      {/* 목록만 스크롤한다 — 제목은 붙어 있어야 어느 구역인지 잃지 않는다 */}
      <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
    </aside>
  );
}
