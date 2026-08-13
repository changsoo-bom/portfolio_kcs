import Image from "next/image";
import { Suspense } from "react";

import { AttractionAddress } from "@/components/world/attraction/AttractionAddress";
import { AttractionPopShell } from "@/components/world/attraction/AttractionPopShell";
import { DetailRow } from "@/components/world/attraction/DetailRow";
import { CATEGORY_LOOK } from "@/constants/attraction-look";
import { messagesOf } from "@/constants/messages";
import { fetchAttractions } from "@/lib/overpass";
import type { LanguageCode } from "@/constants/languages";
import type { RegionBounds } from "@/types/attraction";

type AttractionPopProps = {
  place: string;
  bounds: RegionBounds;
  language: LanguageCode;
  /** 구역 이름. 구글 검색어를 좁히는 데 쓴다. */
  region: string;
};

/** `ko:경복궁` → 위키백과 주소. 언어 접두사가 없으면 링크를 걸지 않는다. */
function wikipediaUrl(value: string) {
  const [language, ...rest] = value.split(":");
  const title = rest.join(":");
  if (!title) return undefined;
  return `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
}

const LINK =
  "px-3 py-1.5 text-xs text-white/70 bg-white/5 rounded-full transition-colors " +
  "hover:bg-white/10 hover:text-white";

/**
 * 장소 상세.
 *
 * **목록을 다시 불러서 그 안에서 찾는다.** 겹쳐 보이지만 그 조회는 이미
 * 캐시돼 있어서 실제 요청이 나가지 않고, 덕분에 장소 하나를 위한 별도
 * API 도 필요 없다. 주소만 공유해도 모달이 그대로 열린다.
 */
export async function AttractionPop({
  place,
  bounds,
  language,
  region,
}: AttractionPopProps) {
  const { attractions } = await fetchAttractions(bounds, language);
  const attraction = attractions.find((item) => item.id === place);
  if (!attraction) return null;

  const look = CATEGORY_LOOK[attraction.category];
  const messages = messagesOf(language);
  const wikipedia = attraction.wikipedia
    ? wikipediaUrl(attraction.wikipedia)
    : undefined;

  /**
   * 이름만으로는 "국립박물관" 같은 것이 세계 곳곳에 있다. 구역 이름을 붙여
   * 검색어를 좁힌다.
   */
  const search = `https://www.google.com/search?q=${encodeURIComponent(
    `${attraction.name} ${region}`,
  )}`;

  return (
    <AttractionPopShell>
      <div className="relative aspect-16/9 w-full">
        {attraction.image ? (
          <Image
            src={attraction.image}
            alt=""
            fill
            sizes="512px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            aria-hidden="true"
            className={`flex items-center justify-center h-full w-full text-5xl text-white/20 bg-gradient-to-br ${look.tint}`}
          >
            {look.mark}
          </div>
        )}
      </div>

      <div className="px-6 pt-5 pb-6">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#b6f5d5]">
          {messages.categories[attraction.category].toUpperCase()}
        </p>
        <h3 className="mt-1 text-xl text-white">{attraction.name}</h3>

        {attraction.description && (
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            {attraction.description}
          </p>
        )}

        <dl className="mt-5">
          {/*
            주소가 태그에 있으면 그걸 쓰고, 없으면 좌표로 짚는다.
            짚는 쪽은 바깥 서버를 한 번 더 타므로 따로 흘려보낸다 —
            같이 묶으면 카드를 눌러도 모달이 안 열린 것처럼 보인다.
          */}
          {attraction.address ? (
            <DetailRow label={messages.address}>{attraction.address}</DetailRow>
          ) : (
            <Suspense
              fallback={
                <DetailRow label={messages.address}>
                  <span className="text-white/30">{messages.locating}</span>
                </DetailRow>
              }
            >
              <AttractionAddress
                lat={attraction.lat}
                lng={attraction.lng}
                language={language}
              />
            </Suspense>
          )}
          {attraction.openingHours && (
            <DetailRow label={messages.openingHours}>
              {attraction.openingHours}
            </DetailRow>
          )}
          {attraction.phone && (
            <DetailRow label={messages.phone}>
              <a href={`tel:${attraction.phone}`} className="hover:text-white">
                {attraction.phone}
              </a>
            </DetailRow>
          )}
          {attraction.website && (
            <DetailRow label={messages.website}>
              <a
                href={attraction.website}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[#b6f5d5] hover:underline"
              >
                {attraction.website.replace(/^https?:\/\//, "")}
              </a>
            </DetailRow>
          )}
          <DetailRow label={messages.coordinates}>
            <span className="font-mono text-xs">
              {attraction.lat.toFixed(5)}, {attraction.lng.toFixed(5)}
            </span>
          </DetailRow>
        </dl>

        <div className="flex flex-wrap gap-2 mt-5">
          {/*
            OSM 태그는 비어 있는 쪽이 흔하다. 더 알아볼 곳을 항상 하나는
            남겨 두려고 검색 링크는 조건 없이 넣는다.
          */}
          <a
            href={search}
            target="_blank"
            rel="noreferrer noopener"
            className={LINK}
          >
            {messages.googleSearch}
          </a>
          {wikipedia && (
            <a
              href={wikipedia}
              target="_blank"
              rel="noreferrer noopener"
              className={LINK}
            >
              {messages.wikipedia}
            </a>
          )}
          <a
            href={`https://www.openstreetmap.org/${attraction.id}`}
            target="_blank"
            rel="noreferrer noopener"
            className={LINK}
          >
            OpenStreetMap
          </a>
        </div>
      </div>
    </AttractionPopShell>
  );
}
