"use client";

import { createTimeline, splitText, stagger, utils } from "animejs";
import { useCallback } from "react";

/**
 * 첫 방문 인트로. 연출 순서를 anime.js 타임라인이 잡는다.
 *
 * 글자 등장 → 카운터 0→100 + 진행 바 → 잠깐 멈춤 → 커버가 위로 걷힘.
 * 네 단계가 서로 물려 있어서 CSS 키프레임 네 벌보다 타임라인 하나가 읽기 쉽다.
 * 중간 타이밍을 바꿀 때 나머지 셋의 delay를 계산하지 않아도 된다.
 *
 * 커버 마크업은 서버에서 온다 — 히어로를 덮는 오버레이라 히어로는 처음부터
 * DOM에 있고 LCP·크롤러에 영향이 없다.
 *
 * 재방문·모션 축소일 때 숨기는 판단은 CSS가 한다(globals.css). JS가 뜬 뒤에
 * 숨기면 커버가 한 번 보였다 사라진다.
 */
export function IntroCover({ line }: { line: string }) {
  const ref = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    const skip =
      document.documentElement.dataset.intro === "seen" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (skip) return;

    const countEl = node.querySelector<HTMLElement>("[data-count]");
    const barEl = node.querySelector<HTMLElement>("[data-bar]");
    const lineEl = node.querySelector<HTMLElement>("[data-line]");
    if (!countEl || !barEl || !lineEl) return;

    // splitText가 DOM을 글자 단위로 다시 쓴다 — cleanup에서 되돌린다
    const split = splitText(lineEl, { words: false, chars: true });
    const counter = { value: 0 };

    const tl = createTimeline({ defaults: { ease: "out(3)" } })
      .add(split.chars, {
        opacity: [0, 1],
        y: ["0.5em", 0],
        duration: 700,
        delay: stagger(14),
      })
      .add(
        counter,
        {
          value: 100,
          duration: 1500,
          ease: "inOut(2)",
          modifier: utils.round(0),
          onUpdate: () => {
            countEl.textContent = `${counter.value}%`;
          },
        },
        // 글자가 다 뜨기 전에 카운터가 시작한다 — 두 동작이 겹쳐야 지루하지 않다
        "-=400",
      )
      .add(
        barEl,
        { scaleX: [0, 1], duration: 1500, ease: "inOut(2)" },
        "<", // 카운터와 동시에
      )
      .add(node, {
        translateY: ["0%", "-100%"],
        duration: 900,
        ease: "inOut(4)",
        delay: 220,
      });

    return () => {
      tl.revert();
      split.revert();
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="intro-cover fixed inset-0 z-50 flex flex-col justify-center px-5 py-16 bg-ink text-surface sm:px-8 lg:px-16"
    >
      <div className="flex flex-col items-center flex-1 justify-center">
        <p
          data-count
          className="font-mono text-sm font-medium tracking-[0.2em] uppercase"
        >
          0%
        </p>

        <div className="intro-bar w-full max-w-[420px] h-px mt-5 bg-surface/25">
          <span data-bar className="h-full bg-surface" />
        </div>
      </div>

      <p
        data-line
        className="max-w-[720px] mx-auto text-center text-sm leading-[1.6] text-surface/70 sm:text-base"
      >
        {line}
      </p>
    </div>
  );
}
