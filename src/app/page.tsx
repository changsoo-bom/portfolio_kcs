import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AttractionCount } from "@/components/world/attraction/AttractionCount";
import { AttractionListSkeleton } from "@/components/world/attraction/AttractionListSkeleton";
import { AttractionMarkers } from "@/components/world/attraction/AttractionMarkers";
import { AttractionPanel } from "@/components/world/attraction/AttractionPanel";
import { AttractionPanelShell } from "@/components/world/attraction/AttractionPanelShell";
import { AttractionPop } from "@/components/world/attraction/AttractionPop";
import { WorldScene } from "@/components/world/scene/WorldScene";
import { DEFAULT_LANGUAGE, LANGUAGES } from "@/constants/languages";
import type { LanguageCode } from "@/constants/languages";
import { regionEntryOf } from "@/lib/overpass";
import { mapSearchParamsSchema } from "@/lib/schemas/attraction";

const CODES: ReadonlySet<string> = new Set(
  LANGUAGES.map((language) => language.code),
);

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const { region, place } = mapSearchParamsSchema.parse(params);

  const raw = params.lang;

  /**
   * **새로고침하면 지구본으로 돌아간다.**
   *
   * 고른 구역은 뒤로가기 때문에 주소에 두지만, 주소를 새로 여는 것은 처음부터
   * 시작한다는 뜻이다. 그래서 문서를 통째로 요청한 경우 — 새로고침·주소창
   * 입력·링크 열기 — 에만 턴다. 화면 안에서의 이동은 `fetch` 라 걸리지 않는다.
   *
   * **Next 의 `rsc` 헤더로는 못 가른다.** 캐시가 그 헤더에 따라 갈라지지 않도록
   * `stripFlightHeaders` 가 앱에 넘기기 전에 지운다. 브라우저가 붙이는 표준
   * 헤더를 쓴다 — 없는 브라우저(사파리 16.4 미만)에서는 그냥 안 턴다.
   *
   * 언어는 남긴다. 그건 고른 것이 아니라 설정이라 새로고침으로 풀리면 곤란하다.
   */
  const dest = (await headers()).get("sec-fetch-dest");
  if ((region || place) && dest === "document") {
    const keep = new URLSearchParams();
    if (typeof raw === "string") keep.set("lang", raw);
    const query = keep.toString();
    redirect(query ? `/?${query}` : "/");
  }
  const language: LanguageCode =
    typeof raw === "string" && CODES.has(raw)
      ? (raw as LanguageCode)
      : DEFAULT_LANGUAGE;

  /**
   * 구역 이름은 여기서 바로 나온다 — 번들에 들어 있는 표를 조회할 뿐이다.
   * 시간이 걸리는 건 명소 조회뿐이라, 제목을 먼저 넘겨 기다리는 화면부터 띄운다.
   */
  const entry = region ? regionEntryOf(region, language) : null;

  /** 카드가 상세로 갈 때 붙일 파라미터. place 는 카드가 직접 얹는다. */
  const query = new URLSearchParams();
  if (region) query.set("region", region);
  if (typeof raw === "string") query.set("lang", raw);

  return (
    // h-dvh 로 높이를 직접 잡는다 — html/body 로 이어지는 퍼센트 사슬에 기대지 않고,
    // 모바일 브라우저 주소창 높이도 dvh 가 알아서 반영한다.
    <main className="relative h-dvh w-full overflow-hidden bg-black">
      <h1 className="sr-only">세계 명소 탐색 지도</h1>
      <WorldScene />

      {/*
        지도 위의 점. 화면에는 아무것도 안 그리므로 fallback 이 필요 없고,
        지도와 따로 흘러서 목록을 기다리는 동안에도 지구본은 돈다.
      */}
      {entry && (
        <Suspense key={region} fallback={null}>
          <AttractionMarkers bounds={entry.bounds} language={language} />
        </Suspense>
      )}

      {/*
        Suspense 로 감싸 **지도가 먼저 뜨게** 한다. Overpass 응답이 몇 초 걸릴 수
        있는데 그동안 지구본까지 붙들려 있으면 클릭이 씹힌 것처럼 보인다.

        기다림은 **껍데기 안쪽에만** 둔다. 껍데기까지 감싸면 목록이 도착할 때
        패널이 통째로 새로 붙어서 등장 애니메이션이 한 번 더 돈다.

        key 에 구역을 넣어야 구역을 바꿀 때마다 대기 상태로 되돌아간다 —
        없으면 이전 구역 목록이 그대로 남아 있다가 툭 바뀐다.
      */}
      {entry && (
        <AttractionPanelShell
          title={entry.name}
          count={
            <Suspense key={region} fallback="SEARCHING…">
              <AttractionCount bounds={entry.bounds} language={language} />
            </Suspense>
          }
        >
          <Suspense key={region} fallback={<AttractionListSkeleton />}>
            <AttractionPanel
              bounds={entry.bounds}
              language={language}
              query={query.toString()}
            />
          </Suspense>
        </AttractionPanelShell>
      )}

      {/*
        상세는 목록과 **같은 조회를 다시 탄다.** 이미 캐시돼 있어서 실제 요청이
        나가지 않고, 덕분에 장소 하나를 위한 별도 API 가 필요 없다.
        fallback 이 null 인 건 목록이 이미 떠 있어서 화면이 비지 않기 때문이다.
      */}
      {entry && place && region && (
        <Suspense key={place} fallback={null}>
          <AttractionPop
            place={place}
            bounds={entry.bounds}
            language={language}
          />
        </Suspense>
      )}
    </main>
  );
}
