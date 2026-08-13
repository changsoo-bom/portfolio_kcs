"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { messagesOf } from "@/constants/messages";
import { useMapParams } from "@/hooks/use-map-params";

/**
 * 모달의 껍데기. **닫는 방법만 맡는다** — 내용은 서버가 만들어 children 으로 온다.
 *
 * 닫는 길을 셋 다 열어 둔다. 바깥 누르기, Esc, 닫기 버튼. 하나라도 막히면
 * 전체 화면을 덮는 모달에서 갇힌 느낌이 난다.
 *
 * **나갈 때는 순서가 뒤집힌다.** 닫기는 주소가 바뀌며 노드가 사라지는 일이라,
 * 주소를 먼저 바꾸면 애니메이션을 걸 대상이 이미 없다. 그래서 표시만 먼저
 * 닫는 모양으로 바꾸고, 애니메이션이 끝났다는 신호를 받은 뒤에 주소를 바꾼다.
 */
export function AttractionPopShell({ children }: { children: ReactNode }) {
  const { language, setPlace } = useMapParams();
  const [closing, setClosing] = useState(false);
  const close = messagesOf(language).close;

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
        aria-label={close}
        onClick={() => setClosing(true)}
        className={`absolute inset-0 h-full w-full bg-black/60 cursor-default ${
          closing ? "animate-backdrop-out" : "animate-backdrop-in"
        }`}
      />

      <div
        onKeyDown={(event) => {
          if (event.key === "Escape") setClosing(true);
        }}
        /*
          상자가 끝나면 주소를 바꾼다. 배경이 아니라 상자에 거는 건 상자가
          더 오래 남기 때문이다 — 배경 기준으로 지우면 상자가 잘린다.

          currentTarget 비교는 안쪽 카드의 애니메이션이 올라와 먼저 닫아버리는
          걸 막는다.
        */
        onAnimationEnd={(event) => {
          if (closing && event.target === event.currentTarget) setPlace(null);
        }}
        // 열리자마자 Esc 가 먹으려면 이 상자가 초점을 받아야 한다
        tabIndex={-1}
        autoFocus
        className={`relative w-full max-w-lg max-h-[85dvh] overflow-y-auto overscroll-contain scrollbar-slim rounded-2xl border border-white/15 bg-[#0d1218] outline-hidden ${
          closing ? "animate-pop-out" : "animate-pop-in"
        }`}
      >
        <button
          type="button"
          aria-label={close}
          onClick={() => setClosing(true)}
          className="absolute top-3 right-3 z-10 flex items-center justify-center h-8 w-8 text-white/70 bg-black/50 rounded-full backdrop-blur transition-colors hover:bg-black/70 hover:text-white"
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  );
}
