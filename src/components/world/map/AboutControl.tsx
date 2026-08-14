"use client";

import { CircleQuestionMark } from "lucide-react";
import Link from "next/link";

import { messagesOf } from "@/constants/messages";
import type { LanguageCode } from "@/constants/languages";

/**
 * 이 지도가 무엇인지 설명하는 페이지로 가는 (?) 버튼.
 *
 * **버튼이 아니라 링크다.** `/about` 은 실제 라우트라 주소로 공유되고 새 탭으로
 * 열리는데, `onClick` 으로 밀면 그 둘이 다 사라진다.
 *
 * 언어를 prop 으로 받는 건 부모(`WorldMap`)가 이미 들고 있기 때문이다 —
 * 여기서 `useMapParams` 를 또 부르면 같은 값을 두 번 구독한다.
 */
export function AboutControl({ language }: { language: LanguageCode }) {
  const label = messagesOf(language).about;

  return (
    <Link
      href="/about"
      aria-label={label}
      title={label}
      className="flex items-center justify-center h-10 w-10 text-white/60 bg-black/60 border border-white/15 rounded-full backdrop-blur transition-colors hover:text-white"
    >
      <CircleQuestionMark aria-hidden="true" strokeWidth={1.5} className="h-5 w-5" />
    </Link>
  );
}
