"use client";

import type { ReactNode } from "react";

import { useMapParams } from "@/hooks/use-map-params";

/**
 * 모달의 껍데기. **닫는 방법만 맡는다** — 내용은 서버가 만들어 children 으로 온다.
 *
 * 닫는 길을 셋 다 열어 둔다. 바깥 누르기, Esc, 닫기 버튼. 하나라도 막히면
 * 전체 화면을 덮는 모달에서 갇힌 느낌이 난다.
 */
export function AttractionPopShell({ children }: { children: ReactNode }) {
  const { closePlace } = useMapParams();

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/*
        배경. 버튼으로 두면 스크린리더가 "버튼"으로 읽어 혼란스럽고, div 에
        onClick 만 달면 키보드로 못 닫는다 — 그래서 Esc 를 아래에서 따로 받는다.
      */}
      <button
        type="button"
        aria-label="닫기"
        onClick={closePlace}
        className="absolute inset-0 h-full w-full bg-black/60 cursor-default"
      />

      <div
        onKeyDown={(event) => {
          if (event.key === "Escape") closePlace();
        }}
        // 열리자마자 Esc 가 먹으려면 이 상자가 초점을 받아야 한다
        tabIndex={-1}
        autoFocus
        className="relative w-full max-w-lg max-h-[85dvh] overflow-y-auto overscroll-contain rounded-2xl border border-white/15 bg-[#0d1218] outline-hidden"
      >
        <button
          type="button"
          aria-label="닫기"
          onClick={closePlace}
          className="absolute top-3 right-3 z-10 flex items-center justify-center h-8 w-8 text-white/70 bg-black/50 rounded-full backdrop-blur transition-colors hover:bg-black/70 hover:text-white"
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  );
}
