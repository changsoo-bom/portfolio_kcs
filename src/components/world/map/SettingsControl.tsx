"use client";

import { useState } from "react";

import { LANGUAGES } from "@/constants/languages";
import { useMapParams } from "@/hooks/use-map-params";

export function SettingsControl() {
  const { language, setLanguage } = useMapParams();
  const [open, setOpen] = useState(false);

  return (
    // 팝오버가 이 상자를 기준으로 붙는다. 화면 고정은 부모가 한다.
    <div className="relative">
      <button
        type="button"
        aria-label="설정"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex items-center justify-center h-10 w-10 rounded-full border border-white/15 bg-black/60 backdrop-blur transition-colors ${
          open ? "text-white" : "text-white/60 hover:text-white"
        }`}
      >
        {/*
          톱니바퀴. 아이콘 하나 때문에 라이브러리를 넣지 않는다.
          바깥 톱니는 8갈래를 45도씩 돌려 그리고 가운데를 뚫는다.
        */}
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`h-5 w-5 transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
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
        className={`absolute top-0 left-12 w-40 origin-top-left rounded-2xl border border-white/15 bg-black/85 p-2 transition-[opacity,scale,visibility] duration-200 ease-out ${
          open ? "visible scale-100 opacity-100" : "invisible scale-90 opacity-0"
        }`}
      >
        <p className="px-2 py-1 font-mono text-[10px] tracking-[0.2em] text-white/40">
          LANGUAGE
        </p>
        <ul>
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
                className={`flex items-center w-full px-2 py-1.5 text-left text-sm rounded-lg transition-colors ${
                  code === language
                    ? "text-[#b6f5d5] bg-white/10"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
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
