import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "World Atlas — 프로젝트 소개",
  description:
    "지구본에서 나라와 지역을 따라 들어가 명소를 찾는 지도를 무엇으로, 왜 그렇게 만들었는지 한 장으로 정리했습니다.",
};

/**
 * 지도가 무엇인지 설명하는 한 장짜리 페이지. (?) 버튼이 여기로 온다.
 *
 * **서버 컴포넌트다.** 상태도 이벤트도 없는 글이라 클라이언트로 내릴 이유가 없다.
 *
 * **문구가 한국어뿐이다.** 지도 UI 는 `constants/messages` 로 10개 언어를 도는데,
 * 이 페이지는 포트폴리오 설명이라 읽는 사람이 정해져 있다. 번역이 필요해지면
 * 문단을 그 표로 옮기는 것이 아니라 라우트를 언어별로 가르는 편이 낫다 —
 * 표는 단어를 담는 그릇이지 문단을 담는 그릇이 아니다.
 */

/** 지구본 팔레트를 그대로 쓴다(`WorldMap` 의 GLOBE). 화면이 이어져 보여야 한다. */
const SPACE = "#0a0a24";
const INK = "#eafff2";
const ACCENT = "#b6f5d5";

const STACK = [
  { name: "Next.js 16", role: "App Router · 서버 컴포넌트 · 데이터 캐시" },
  { name: "React 19.2", role: "React Compiler · Suspense 경계" },
  { name: "TypeScript", role: "strict · any 금지" },
  { name: "MapLibre GL 6", role: "지구본 투영 · 벡터/래스터 레이어 · 호버 판정" },
  { name: "three.js", role: "배경 별하늘 4,200개 (커스텀 셰이더 · 블룸)" },
  { name: "anime.js 4", role: "첫 진입 인트로 커튼" },
  { name: "Tailwind CSS 4", role: "설정 파일 없이 CSS 토큰으로" },
  { name: "Zod 4", role: "외부 응답과 주소 파라미터 검증" },
];

const DATA = [
  {
    name: "OpenStreetMap — Overpass",
    role: "명소 (tourism 8종)",
    license: "ODbL",
  },
  {
    name: "EOX Sentinel-2 cloudless",
    role: "위성 사진",
    license: "CC BY-NC-SA 4.0 · 비상업",
  },
  { name: "OpenFreeMap", role: "도로 · 경계 · 지명 타일", license: "ODbL" },
  {
    name: "Natural Earth 1:10m",
    role: "행정구역 폴리곤 4,584개",
    license: "Public domain",
  },
  {
    name: "Wikidata · Wikimedia Commons",
    role: "명소 사진",
    license: "출처 표기",
  },
  { name: "Nominatim", role: "주소가 없는 명소의 역지오코딩", license: "ODbL" },
];

const DECISIONS = [
  {
    title: "명소 조회를 서버에 둔 이유는 캐시입니다",
    body: "Overpass 는 공용 무료 서버라 호출량 제한이 있습니다. 브라우저에서 부르면 방문자 수만큼 그대로 나가지만, 서버에서 부르고 하루 단위로 캐시하면 구역당 하루 한 번으로 줄어듭니다. 서버 컴포넌트를 쓴 실질적인 이유가 이것입니다.",
  },
  {
    title: "화면 상태를 주소에 담았습니다",
    body: "고른 나라·구역·분류·언어가 전부 검색 파라미터에 있습니다. 그래서 지도를 눌러 고르든 위쪽 필터에서 고르든 같은 곳을 보고, 한쪽을 다른 쪽에 맞춰 주는 코드가 필요 없습니다. 뒤로가기로 패널과 상세가 차례로 닫히는 것도 여기서 따라옵니다.",
  },
  {
    title: "경계선과 칠을 같은 자료에서 뽑습니다",
    body: "처음에는 선을 OpenStreetMap 에서, 칠을 Natural Earth 에서 가져왔습니다. 두 자료의 행정구역 구분이 다른 나라가 있어서 — 케냐는 8개 주가 47개 카운티로 개편됐습니다 — 커서를 올린 면이 화면의 선과 맞지 않았습니다.",
  },
  {
    title: "링크가 되는 값은 화면이 아니라 입구에서 거릅니다",
    body: "OpenStreetMap 태그는 누구나 편집할 수 있는데 그 값이 그대로 링크 주소가 됩니다. 검증을 화면에 두면 신뢰 경계가 여러 곳이 되므로, 데이터를 받는 한 곳에서 스킴과 모양을 확인한 값만 내보냅니다.",
  },
  {
    title: "장식보다 조작 정확도를 택했습니다",
    body: "커서를 따라 지도를 살짝 미는 시차 효과가 있었지만 뺐습니다. 지도가 커서 밑에서 미끄러지는 동안 호버 판정이 이전 위치를 가리켜서, 지구 바깥인데도 엉뚱한 나라가 잡혔기 때문입니다. 대신 별하늘만 카메라를 기울여 움직입니다.",
  },
];

const NUMBERS = [
  { value: "4,584", label: "탐색 가능한 행정구역" },
  { value: "10", label: "지원 언어" },
  { value: "0", label: "필요한 API 키" },
  { value: "1회", label: "구역당 하루 외부 호출" },
];

export default function About() {
  return (
    <main
      className="min-h-dvh px-6 py-16 sm:px-10"
      style={{ background: SPACE, color: INK }}
    >
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-14 font-mono text-xs tracking-[0.2em] text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
          지구본으로
        </Link>

        <header className="pb-10 border-b border-white/10">
          <p
            className="mb-5 font-mono text-xs tracking-[0.4em]"
            style={{ color: ACCENT }}
          >
            WORLD ATLAS
          </p>
          <h1 className="text-3xl leading-tight font-semibold sm:text-4xl">
            지구본에서 나라와 지역을 따라 들어가
            <br />그 지역의 명소를 찾는 지도입니다.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-white/60">
            전 세계 4,584개 행정구역을 대상으로 합니다. 나라를 누르면 그 안의
            지역이 갈라지고, 지역을 누르면 오른쪽에 명소 목록이 열립니다.
            명소 정보는 모두 공개 데이터에서 옵니다.
          </p>
        </header>

        {/* 숫자 넷. 이 프로젝트의 성격이 여기서 한눈에 읽힌다 */}
        <section className="grid grid-cols-2 gap-px mt-10 bg-white/10 border border-white/10 rounded-2xl overflow-hidden sm:grid-cols-4">
          {NUMBERS.map(({ value, label }) => (
            <div
              key={label}
              className="px-4 py-5"
              style={{ background: SPACE }}
            >
              <p
                className="text-2xl leading-none font-semibold tabular-nums"
                style={{ color: ACCENT }}
              >
                {value}
              </p>
              <p className="mt-2 text-xs leading-snug text-white/50">{label}</p>
            </div>
          ))}
        </section>

        <Section title="무엇으로 만들었나">
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-[13rem_1fr]">
            {STACK.map(({ name, role }) => (
              <Row key={name} term={name} detail={role} />
            ))}
          </dl>
        </Section>

        <Section title="데이터는 어디서 오나">
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-[13rem_1fr]">
            {DATA.map(({ name, role, license }) => (
              <Row key={name} term={name} detail={`${role} · ${license}`} />
            ))}
          </dl>
          <p className="mt-6 text-sm leading-relaxed text-white/40">
            위성 사진은 비상업 이용 조건(CC BY-NC-SA 4.0)이라 상업적으로 쓰려면
            교체해야 합니다. 지도 화면 오른쪽 아래 (i) 를 누르면 표시 의무가
            있는 출처가 모두 나옵니다.
          </p>
        </Section>

        <Section title="만들면서 내린 결정">
          <ol className="grid gap-8">
            {DECISIONS.map(({ title, body }, index) => (
              <li key={title} className="grid gap-2">
                <p className="flex items-baseline gap-3 text-base font-semibold">
                  <span
                    className="font-mono text-xs tabular-nums"
                    style={{ color: ACCENT }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {title}
                </p>
                <p className="text-sm leading-relaxed text-white/60 sm:pl-9">
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        <footer className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-20 pt-8 border-t border-white/10 font-mono text-xs tracking-[0.2em] text-white/40">
          <a
            href="https://github.com/changsoo-bom/world-atlas"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-white"
          >
            GITHUB ↗
          </a>
          <Link href="/" className="transition-colors hover:text-white">
            지구본으로 ↩
          </Link>
        </footer>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="pb-6 font-mono text-xs tracking-[0.3em] text-white/40">
        {title.toUpperCase()}
      </h2>
      {children}
    </section>
  );
}

/**
 * `<dl>` 의 한 줄. dt/dd 는 형제로 놓여야 문법이 맞아서 조각으로 감싼다 —
 * `<div>` 로 묶으면 위 grid 의 두 칸 배치가 통째로 무너진다.
 */
function Row({ term, detail }: { term: string; detail: string }) {
  return (
    <>
      <dt className="text-sm font-semibold">{term}</dt>
      <dd className="text-sm leading-relaxed text-white/55">{detail}</dd>
    </>
  );
}
