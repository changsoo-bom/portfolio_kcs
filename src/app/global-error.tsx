"use client";

import { useEffect } from "react";

import { DEFAULT_LANGUAGE } from "@/constants/languages";
import { messagesOf } from "@/constants/messages";

/**
 * 레이아웃까지 무너졌을 때의 마지막 화면.
 *
 * **`error.tsx` 는 자기 위의 레이아웃이 던진 것을 못 잡는다.** 루트 레이아웃이
 * 실패하면 그 아래 경계는 아예 그려지지도 않아서, 이 파일이 없으면 사용자는
 * Next 의 기본 오류 화면을 본다.
 *
 * 그래서 여기는 **`<html>` 과 `<body>` 를 직접 만든다** — 무너진 게 바로 그
 * 레이아웃이라 대신 씌워 줄 것이 없다. 같은 이유로 전역 CSS 도 못 믿어서
 * 색과 배치를 인라인으로 박는다. 언어는 주소를 못 읽으니 기본값이다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[layout]", error);
  }, [error]);

  const messages = messagesOf(DEFAULT_LANGUAGE);

  return (
    <html lang={DEFAULT_LANGUAGE}>
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          height: "100dvh",
          margin: 0,
          padding: "0 1.5rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          color: "#ffffff",
          background: "#000000",
        }}
      >
        <h1 style={{ fontSize: "1.125rem", fontWeight: 400 }}>
          {messages.unavailable}
        </h1>

        <button
          type="button"
          onClick={reset}
          style={{
            height: "2.5rem",
            padding: "0 1.5rem",
            fontSize: "0.875rem",
            color: "#000000",
            background: "#ffffff",
            border: "none",
            borderRadius: "9999px",
            cursor: "pointer",
          }}
        >
          {messages.reset}
        </button>
      </body>
    </html>
  );
}
