"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { messagesOf } from "@/constants/messages";
import { useMapParams } from "@/hooks/use-map-params";

/**
 * 제목에 붙는 id. 모달은 한 번에 하나뿐이라 고정 값으로 충분하다.
 * 상세 본문(서버 컴포넌트)이 이걸 제목에 달고, 여기서 `aria-labelledby` 로 묶는다.
 */
export const POP_TITLE_ID = "attraction-pop-title";

/** 탭이 닿는 것들. 트랩이 순환시킬 대상이다. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const boxRef = useRef<HTMLDivElement>(null);
  const close = messagesOf(language).close;

  /**
   * 초점을 상자로 들이고, 닫을 때 **원래 있던 곳으로 돌려준다.**
   *
   * `autoFocus` 로도 들이는 건 되지만 그건 돌려주지 못한다. 카드를 눌러 연
   * 모달을 닫으면 초점이 body 로 떨어져서, 키보드만 쓰는 사람은 문서 맨
   * 위부터 다시 탭해 그 카드를 찾아와야 한다.
   */
  useEffect(() => {
    const opener = document.activeElement;
    boxRef.current?.focus();

    return () => {
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={POP_TITLE_ID}
      /**
       * 키 처리를 **상자가 아니라 여기서** 한다. 상자에 걸어 두면 초점이 밖으로
       * 나가는 순간 Esc 도 같이 안 먹어서, 배경 클릭을 못 쓰는 키보드 사용자는
       * 나갈 길이 없어진다.
       */
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setClosing(true);
          return;
        }
        if (event.key !== "Tab") return;

        // 탭이 모달을 빠져나가지 않게 양 끝을 이어 붙인다
        const box = boxRef.current;
        const items = box
          ? [...box.querySelectorAll<HTMLElement>(FOCUSABLE)]
          : [];
        if (items.length === 0) return;

        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && (active === first || active === box)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      {/*
        배경. 버튼으로 두면 스크린리더가 "버튼"으로 읽어 혼란스럽고, div 에
        onClick 만 달면 키보드로 못 닫는다 — 그래서 Esc 를 아래에서 따로 받는다.
      */}
      <button
        type="button"
        aria-label={close}
        onClick={() => setClosing(true)}
        // 탭 순서에서 뺀다 — 같은 일을 하는 닫기 버튼이 상자 안에 있고,
        // 여기까지 탭이 닿으면 트랩이 모달 밖을 한 칸 도는 셈이 된다
        tabIndex={-1}
        className={`absolute inset-0 h-full w-full bg-black/60 cursor-default ${
          closing ? "animate-backdrop-out" : "animate-backdrop-in"
        }`}
      />

      <div
        ref={boxRef}
        /*
          상자가 끝나면 주소를 바꾼다. 배경이 아니라 상자에 거는 건 상자가
          더 오래 남기 때문이다 — 배경 기준으로 지우면 상자가 잘린다.

          currentTarget 비교는 안쪽 카드의 애니메이션이 올라와 먼저 닫아버리는
          걸 막는다.
        */
        onAnimationEnd={(event) => {
          if (closing && event.target === event.currentTarget) setPlace(null);
        }}
        // 초점을 받을 수 있어야 위 effect 가 여기로 들일 수 있다
        tabIndex={-1}
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
