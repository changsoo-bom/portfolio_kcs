"use client";

import dynamic from "next/dynamic";

/**
 * 별하늘 배경 — **불러오는 것만 미룬다.** 그리는 일은 `StarfieldCanvas` 다.
 *
 * three 와 후처리 네 개가 압축해서 첫 화면 JS 의 상당 부분을 차지하는데,
 * 별하늘은 지도 뒤에 깔리는 장식이라 그중 **아무것도 첫 페인트에 필요 없다.**
 * 정적 import 로 두면 지구본이 그것들을 다 받은 뒤에야 뜬다.
 *
 * `ssr: false` 는 서버 렌더를 버리는 게 아니라 **버릴 것이 없어서** 준다 —
 * 캔버스는 `useEffect` 가 돌기 전까지 빈 화면이라, 서버가 미리 그려 봐야
 * 나오는 것이 같다. 그동안은 `<main>` 의 검정이 그대로 보인다.
 *
 * 이 껍데기가 `"use client"` 인 것이 조건이다 — `ssr: false` 는 서버 컴포넌트
 * 안에서 못 쓴다. 부모 `WorldScene` 은 서버 컴포넌트로 남는다.
 */
const StarfieldCanvas = dynamic(
  () =>
    import("@/components/world/scene/StarfieldCanvas").then(
      (module) => module.StarfieldCanvas,
    ),
  { ssr: false },
);

export function Starfield() {
  return <StarfieldCanvas />;
}
