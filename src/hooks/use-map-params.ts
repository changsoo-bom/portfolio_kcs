"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { DEFAULT_LANGUAGE, LANGUAGES } from "@/constants/languages";
import type { LanguageCode } from "@/constants/languages";

const CODES: ReadonlySet<string> = new Set(
  LANGUAGES.map((language) => language.code),
);

/**
 * 지도 상태 중 **URL 로 표현되는 것들**을 읽고 쓴다.
 *
 * 언어와 선택한 구역을 state 가 아니라 주소에 두는 이유는 두 가지다.
 * 하나는 "일본어로 본 홋카이도" 같은 링크가 그대로 공유된다는 것이고,
 * 다른 하나는 **명소 목록을 서버에서 그리기 때문**이다 — 서버 컴포넌트는
 * 클라이언트 state 를 볼 수 없어서, 이 두 값이 주소에 있어야 목록을 만든다.
 */
export function useMapParams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const raw = searchParams.get("lang");
  const language: LanguageCode =
    raw && CODES.has(raw) ? (raw as LanguageCode) : DEFAULT_LANGUAGE;

  const region = searchParams.get("region");

  /**
   * **주소를 훅이 준 값이 아니라 window 에서 읽는다.**
   *
   * useSearchParams 의 결과는 렌더마다 새 객체라, 그걸 참조하면 아래 두
   * 콜백도 매번 새로 만들어진다. 지도 이벤트 핸들러는 마운트 때 한 번만
   * 붙어서 그 시점의 콜백을 붙들기 때문에, 그러면 첫 렌더의 낡은 주소를
   * 기준으로 파라미터를 덮어써서 언어 선택 같은 게 지워진다.
   *
   * 호출 시점의 실제 주소를 읽으면 그 문제가 없고, router 는 안정적이라
   * 콜백도 한 번만 만들어진다.
   */
  const update = useCallback(
    (mutate: (params: URLSearchParams) => void, replace: boolean) => {
      const next = new URLSearchParams(window.location.search);
      mutate(next);
      const query = next.toString();
      const url = query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;
      // scroll:false — 전체 화면 지도라 스크롤이 없고, 되돌리면 지도가 튄다
      if (replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [router],
  );

  // 언어는 되돌리기 대상이 아니다. 히스토리에 쌓이면 뒤로가기가 언어만 되감는다.
  const setLanguage = useCallback(
    (value: LanguageCode) => {
      update((params) => {
        if (value === DEFAULT_LANGUAGE) params.delete("lang");
        else params.set("lang", value);
      }, true);
    },
    [update],
  );

  // 구역은 되돌리기 대상이다 — 뒤로가기로 패널이 닫히는 게 자연스럽다.
  const setRegion = useCallback(
    (value: string | null) => {
      update((params) => {
        if (value) params.set("region", value);
        // 구역을 닫으면 그 안에서 열어 둔 장소도 같이 닫힌다
        else {
          params.delete("region");
          params.delete("place");
        }
      }, false);
    },
    [update],
  );

  // 장소도 되돌리기 대상이다 — 뒤로가기로 모달만 닫히고 목록은 남는다.
  const setPlace = useCallback(
    (value: string | null) => {
      update((params) => {
        if (value) params.set("place", value);
        else params.delete("place");
      }, false);
    },
    [update],
  );

  return { language, region, setLanguage, setRegion, setPlace };
}
