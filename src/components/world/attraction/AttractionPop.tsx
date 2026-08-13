import Image from "next/image";

import { AttractionPopShell } from "@/components/world/attraction/AttractionPopShell";
import { CATEGORY_LABEL, CATEGORY_LOOK } from "@/constants/attraction-look";
import { fetchAttractions } from "@/lib/overpass";
import type { LanguageCode } from "@/constants/languages";
import type { RegionBounds } from "@/types/attraction";

type AttractionPopProps = {
  place: string;
  bounds: RegionBounds;
  language: LanguageCode;
};

/** `ko:경복궁` → 위키백과 주소. 언어 접두사가 없으면 링크를 걸지 않는다. */
function wikipediaUrl(value: string) {
  const [language, ...rest] = value.split(":");
  const title = rest.join(":");
  if (!title) return undefined;
  return `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-2.5 border-t border-white/5">
      <dt className="shrink-0 w-16 text-xs text-white/35">{label}</dt>
      <dd className="min-w-0 text-sm break-words text-white/80">{children}</dd>
    </div>
  );
}

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
}: AttractionPopProps) {
  const { attractions } = await fetchAttractions(bounds, language);
  const attraction = attractions.find((item) => item.id === place);
  if (!attraction) return null;

  const look = CATEGORY_LOOK[attraction.category];
  const wikipedia = attraction.wikipedia
    ? wikipediaUrl(attraction.wikipedia)
    : undefined;

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
          {CATEGORY_LABEL[attraction.category].toUpperCase()}
        </p>
        <h3 className="mt-1 text-xl text-white">{attraction.name}</h3>

        {attraction.description && (
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            {attraction.description}
          </p>
        )}

        <dl className="mt-5">
          {attraction.address && (
            <Row label="주소">{attraction.address}</Row>
          )}
          {attraction.openingHours && (
            <Row label="영업시간">{attraction.openingHours}</Row>
          )}
          {attraction.phone && (
            <Row label="전화">
              <a href={`tel:${attraction.phone}`} className="hover:text-white">
                {attraction.phone}
              </a>
            </Row>
          )}
          {attraction.website && (
            <Row label="웹사이트">
              <a
                href={attraction.website}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[#b6f5d5] hover:underline"
              >
                {attraction.website.replace(/^https?:\/\//, "")}
              </a>
            </Row>
          )}
          <Row label="좌표">
            <span className="font-mono text-xs">
              {attraction.lat.toFixed(5)}, {attraction.lng.toFixed(5)}
            </span>
          </Row>
        </dl>

        <div className="flex flex-wrap gap-2 mt-5">
          {wikipedia && (
            <a
              href={wikipedia}
              target="_blank"
              rel="noreferrer noopener"
              className="px-3 py-1.5 text-xs text-white/70 bg-white/5 rounded-full transition-colors hover:bg-white/10 hover:text-white"
            >
              위키백과
            </a>
          )}
          <a
            href={`https://www.openstreetmap.org/${attraction.id}`}
            target="_blank"
            rel="noreferrer noopener"
            className="px-3 py-1.5 text-xs text-white/70 bg-white/5 rounded-full transition-colors hover:bg-white/10 hover:text-white"
          >
            OpenStreetMap
          </a>
        </div>
      </div>
    </AttractionPopShell>
  );
}
