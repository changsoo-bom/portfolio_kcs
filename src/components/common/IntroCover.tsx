"use client";

import { createTimeline, stagger } from "animejs";

/** 커튼 패널 수. 늘릴수록 와이프가 잘게 쪼개진다. */
const PANEL_COUNT = 12;
const PANELS = Array.from({ length: PANEL_COUNT }, (_, index) => index);

/**
 * 지구본 팔레트를 그대로 쓴다(`WorldMap` 의 GLOBE).
 *
 * 예전에는 밝은 회색 커튼에 검은 글씨였다. 그러면 커튼이 걷히는 순간 밝은
 * 화면에서 우주로 뚝 떨어져서, 로딩과 지도가 서로 다른 사이트처럼 보인다.
 *
 * 커튼은 **바다색**이다. 뒤에 드러날 우주색(#0a0a24)보다 청록 쪽이라 걷히는
 * 움직임이 읽히면서도 같은 계열에 머문다 — 같은 색으로 두면 무엇이 걷혔는지
 * 보이지 않는다.
 */
const CURTAIN = "#0d2233";
const INK = "#eafff2";
/** 화면에서 유일하게 색을 띠는 자리. 지도의 호버와 같은 제이드다. */
const ACCENT = "#b6f5d5";

/**
 * 첫 진입 시 한 번 재생되는 로딩 커버.
 * 화면 중앙 프로그레스가 끝나면 세로 패널이 가운데서 바깥으로 걷힌다.
 */
export function IntroCover() {
  return (
    <div
      ref={(el) => {
        // cleanup을 반환하는 ref는 null로 호출되지 않지만 타입상 열려 있다
        if (!el) return;
        /**
         * **지도 화면에서만 재생한다.** 이 커버는 레이아웃에 있어서 `/about`
         * 같은 다른 라우트에도 딸려 오는데, 읽을 글이 있는 페이지를 3.6초 동안
         * 덮으면 그건 로딩 표시가 아니라 방해다.
         *
         * 화면 안에서 오가는 경우는 레이아웃이 다시 마운트되지 않으므로 여기
         * 걸리지 않는다 — 문서를 통째로 요청한 첫 진입에만 판정한다.
         */
        if (window.location.pathname !== "/") {
          el.style.display = "none";
          return;
        }
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          el.style.display = "none";
          return;
        }

        const status = el.querySelector<HTMLElement>("[data-status]");
        const percent = el.querySelector<HTMLElement>("[data-percent]");
        const fill = el.querySelector<HTMLElement>("[data-fill]");
        const panels = el.querySelectorAll<HTMLElement>("[data-panel]");
        if (!status || !percent || !fill || panels.length === 0) return;

        const root = document.documentElement;
        root.style.overflow = "hidden";

        const progress = { value: 0 };

        const timeline = createTimeline({
          defaults: { ease: "outQuart" },
          onComplete: () => {
            root.style.overflow = "";
            el.style.visibility = "hidden";
          },
        })
          // 숫자와 막대를 한 애니메이션에서 같이 그린다 — 어긋날 여지가 없다
          .add(
            progress,
            {
              value: 100,
              duration: 2200,
              ease: "inOutQuad",
              onUpdate: () => {
                percent.textContent = String(Math.round(progress.value));
                fill.style.transform = `scaleX(${progress.value / 100})`;
              },
            },
            0,
          )
          .add(status, { opacity: 0, y: -16, duration: 400 }, "+=200")
          .add(
            panels,
            {
              y: "-100%",
              duration: 1000,
              ease: "inOutExpo",
              // 가운데 패널부터 좌우 바깥으로 퍼진다
              delay: stagger(60, { from: "center" }),
            },
            "-=150",
          );

        return () => {
          timeline.pause();
          root.style.overflow = "";
        };
      }}
      aria-hidden="true"
      /*
        pointer-events-none 이 있어야 한다. 커튼이 걷히는 3.6초 동안 지도는
        이미 떠서 조작할 수 있는 상태인데, 없으면 그 시간의 클릭과 드래그를
        이 덮개가 통째로 삼킨다 — 화면은 준비됐는데 아무 반응이 없다.
      */
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {PANELS.map((index) => (
        <div
          key={index}
          data-panel
          className="absolute inset-y-0"
          style={{
            background: CURTAIN,
            left: `${(index * 100) / PANEL_COUNT}%`,
            // 1px 여유로 패널 사이 서브픽셀 이음매를 덮는다
            width: `calc(${100 / PANEL_COUNT}% + 1px)`,
          }}
        />
      ))}

      <div
        data-status
        className="relative flex h-full flex-col items-center justify-center"
      >
        <div className="w-[80vw] max-w-2xl" style={{ color: INK }}>
          <div className="flex items-end justify-between pb-5 font-mono">
            <span className="text-sm tracking-[0.4em] sm:text-base">LOADING</span>
            <span className="flex items-center gap-1 leading-none font-medium tabular-nums">
              <span data-percent className="text-3xl sm:text-4xl">
                0
              </span>
              <span className="text-base sm:text-lg">%</span>
            </span>
          </div>
          {/* 홈이 너무 밝으면 막대가 어디까지 찼는지 안 읽힌다 */}
          <div className="h-[3px] w-full" style={{ background: `${INK}33` }}>
            {/* Tailwind의 scale-* 는 CSS scale 속성이라 anime.js의 transform 과 겹친다 — 인라인 transform 으로 통일 */}
            <div
              data-fill
              className="h-full w-full origin-left"
              style={{ background: ACCENT, transform: "scaleX(0)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
