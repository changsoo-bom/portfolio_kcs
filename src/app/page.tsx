import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AttractionCount } from "@/components/world/attraction/AttractionCount";
import { AttractionListSkeleton } from "@/components/world/attraction/AttractionListSkeleton";
import { AttractionMarkers } from "@/components/world/attraction/AttractionMarkers";
import { AttractionPanel } from "@/components/world/attraction/AttractionPanel";
import { AttractionPanelShell } from "@/components/world/attraction/AttractionPanelShell";
import { AttractionPop } from "@/components/world/attraction/AttractionPop";
import { FilterBar } from "@/components/world/map/FilterBar";
import { WorldScene } from "@/components/world/scene/WorldScene";
import { languageOf } from "@/constants/languages";
import { messagesOf } from "@/constants/messages";
import {
  countryBoundsOf,
  countryOf,
  countryOptions,
  regionEntryOf,
  regionOptions,
} from "@/lib/regions";
import { mapSearchParamsSchema } from "@/lib/schemas/attraction";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const { region, place, country } = mapSearchParamsSchema.parse(params);

  const raw = params.lang;

  /**
   * **새로고침하면 지구본으로 돌아간다.**
   *
   * 고른 구역은 뒤로가기 때문에 주소에 두지만, 주소를 새로 여는 것은 처음부터
   * 시작한다는 뜻이다. 그래서 문서를 통째로 요청한 경우 — 새로고침·주소창
   * 입력·링크 열기 — 에만 턴다. 화면 안에서의 이동은 `fetch` 라 걸리지 않는다.
   *
   * **Next 가 주는 표시로는 못 가른다.** 캐시가 거기 따라 갈라지지 않도록
   * `rsc` 헤더는 `stripFlightHeaders` 가, `_rsc` 파라미터는 `stripInternalQueries`
   * 가 앱에 넘기기 전에 지운다.
   *
   * 그래서 `accept` 를 본다. 문서 요청만 `text/html` 을 달고 오고, 화면 안에서
   * 부르는 쪽은 `fetch` 기본값이라 안 달고 온다. `sec-fetch-dest` 도 같은 일을
   * 하지만 그건 iframe 안에서 `document` 가 아니고 오래된 브라우저는 안 붙인다.
   *
   * 카드의 `<Link>` 가 미리 당겨오는 요청도 `fetch` 라 여기 안 걸린다 —
   * 걸리면 그 응답이 캐시에 얹혀서 카드를 누르는 순간 초기화된다.
   *
   * 언어는 남긴다. 그건 고른 것이 아니라 설정이라 새로고침으로 풀리면 곤란하다.
   */
  const accept = (await headers()).get("accept") ?? "";
  if ((region || place || country) && accept.includes("text/html")) {
    const keep = new URLSearchParams();
    if (typeof raw === "string") keep.set("lang", raw);
    const query = keep.toString();
    redirect(query ? `/?${query}` : "/");
  }
  const language = languageOf(raw);

  /**
   * 구역 이름은 여기서 바로 나온다 — 번들에 들어 있는 표를 조회할 뿐이다.
   * 시간이 걸리는 건 명소 조회뿐이라, 제목을 먼저 넘겨 기다리는 화면부터 띄운다.
   */
  const entry = region ? regionEntryOf(region, language) : null;
  const messages = messagesOf(language);

  /**
   * 필터 목록은 **서버가 그린다.** 나라·구역 이름표가 1.3MB 라 클라이언트로
   * 보낼 물건이 아니고, 고른 값이 이미 주소에 있어서 목록도 여기서 정해진다.
   *
   * 구역을 골랐으면 나라는 그 앞 세 글자다 — 필터를 안 건드리고 지도만 눌러도
   * 목록이 따라오는 게 이 한 줄이다.
   */
  const picked = country ?? (region ? countryOf(region) : null);
  const target = entry
    ? entry.bounds
    : picked
      ? countryBoundsOf(picked)
      : null;

  /** 카드가 상세로 갈 때 붙일 파라미터. place 는 카드가 직접 얹는다. */
  const query = new URLSearchParams();
  if (region) query.set("region", region);
  if (typeof raw === "string") query.set("lang", raw);

  return (
    // h-dvh 로 높이를 직접 잡는다 — html/body 로 이어지는 퍼센트 사슬에 기대지 않고,
    // 모바일 브라우저 주소창 높이도 dvh 가 알아서 반영한다.
    <main className="relative h-dvh w-full overflow-hidden bg-black">
      <h1 className="sr-only">{messages.title}</h1>

      <FilterBar
        countries={countryOptions(language)}
        regions={picked ? regionOptions(picked, language) : []}
        target={target}
      />
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

        **껍데기에도 key 가 있어야 한다.** 껍데기는 닫는 중인지를 제 안에
        들고 있는데, 닫히는 260ms 사이에 다른 구역을 고르면 제목만 갈리고
        그 표시는 그대로 남는다 — 이어서 애니메이션 종료 신호가 도착해
        방금 고른 구역이 열리지도 않고 닫힌다.
      */}
      {entry && (
        <AttractionPanelShell
          key={region}
          title={entry.name}
          count={
            <Suspense key={region} fallback={messages.searching}>
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
            region={entry.name}
          />
        </Suspense>
      )}
    </main>
  );
}
