"use client";

import { Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { LANGUAGES } from "@/constants/languages";
import { messagesOf } from "@/constants/messages";
import { useMapParams } from "@/hooks/use-map-params";

export function SettingsControl() {
  const { language, setLanguage } = useMapParams();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  /**
   * 바깥을 누르면 닫는다. click 이 아니라 pointerdown 인 건, 누른 채로 지도를
   * 끌고 갔을 때도 닫혀야 하기 때문이다 — 필터 드롭다운과 같은 처리다.
   */
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    // 팝오버가 이 상자를 기준으로 붙는다. 화면 고정은 부모가 한다.
    <div
      ref={rootRef}
      /*
        Esc 로 닫는다. 이게 없으면 키보드만 쓰는 사람은 언어를 고르지 않고
        빠져나올 방법이 없다 — 초점을 옮겨도 팝오버는 열린 채 남는다.
      */
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        setOpen(false);
        triggerRef.current?.focus();
      }}
      className="relative"
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={messagesOf(language).settings}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex items-center justify-center h-10 w-10 rounded-full border border-white/15 bg-black/60 backdrop-blur transition-colors ${
          open ? "text-white" : "text-white/60 hover:text-white"
        }`}
      >
        {/* 열면 45도 돌아간다 — 톱니가 8갈래라 한 칸이 45도다 */}
        <Settings
          aria-hidden="true"
          className={`h-5 w-5 transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        />
      </button>

      {/*
        조건부 렌더가 아니라 **항상 두고 클래스만 바꾼다.** `{open && …}` 로 두면
        닫는 순간 DOM 에서 사라져서 작아지는 모션이 나올 자리가 없다.

        visibility 를 같이 전이시키는 게 요령이다 — 이 속성은 불연속으로 바뀌어서
        나타날 때는 즉시, 사라질 때는 전이가 끝난 뒤에 적용된다. 덕분에 닫히는
        동안에도 보이다가 마지막에 접근성 트리와 탭 순서에서 빠진다.

        전이 목록에 **transform 이 아니라 scale 을 적는다.** Tailwind v4 의
        `scale-*` 은 transform 이 아니라 CSS `scale` 속성으로 컴파일되기 때문에,
        transform 만 걸면 크기가 전이 없이 툭 튀고 투명도만 흐른다.

        backdrop-blur 도 뺐다. 뒤에 WebGL 캔버스가 두 장 깔려 있어서, 크기와
        위치가 매 프레임 바뀌는 동안 그 결과를 다시 흐리게 만드느라 프레임이 샌다.
      */}
      <div
        className={`absolute top-0 left-12 w-40 origin-top-left rounded-2xl border border-white/15 bg-black/85 p-1 transition-[opacity,scale,visibility] duration-200 ease-out ${
          open ? "visible scale-100 opacity-100" : "invisible scale-90 opacity-0"
        }`}
      >
        <p className="px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-white/40 border-b border-white/10">
          LANGUAGE
        </p>
        <ul className="mt-1">
          {LANGUAGES.map(({ code, label }) => (
            <li key={code}>
              <button
                type="button"
                onClick={() => {
                  setLanguage(code);
                  // 고르면 같은 모션으로 접힌다
                  setOpen(false);
                }}
                aria-current={code === language}
                /* 고른 것은 색이 아니라 굵기와 밝기로 가른다 — 필터 드롭다운과 같다 */
                className={`flex items-center w-full px-3 py-1.5 text-left text-sm rounded-full transition-colors hover:bg-white/10 ${
                  code === language
                    ? "font-semibold text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
