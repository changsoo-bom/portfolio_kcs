"use client";

import { useEffect } from "react";

import { DEFAULT_LANGUAGE } from "@/constants/languages";
import { messagesOf } from "@/constants/messages";

/**
 * 예기치 못한 오류의 마지막 그물.
 *
 * 바깥 API 는 `lib` 에서 전부 잡아 "불러올 수 없음" 으로 떨어지므로 여기까지
 * 오는 일은 드물다. 그래도 없으면 그 드문 한 번에 Next 의 기본 화면 —
 * 아무 설명도, 돌아갈 길도 없는 검은 화면 — 이 그대로 보인다.
 *
 * **여기서는 주소를 읽을 수 없다.** 오류 화면은 검색 파라미터를 못 받아서
 * 언어를 알 방법이 없다. 그래서 기본 언어로 적는다.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[page]", error);
  }, [error]);

  const messages = messagesOf(DEFAULT_LANGUAGE);

  return (
    <main className="flex flex-col items-center justify-center gap-6 h-dvh w-full px-6 text-center bg-black">
      <p className="font-mono text-[10px] tracking-[0.3em] text-white/40">
        {messages.title.toUpperCase()}
      </p>
      <h1 className="text-lg text-white">{messages.unavailable}</h1>

      <button
        type="button"
        onClick={reset}
        className="h-10 px-6 text-sm text-black bg-white rounded-full transition-colors hover:bg-white/75"
      >
        {messages.reset}
      </button>
    </main>
  );
}
