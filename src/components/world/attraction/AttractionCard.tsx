import Image from "next/image";
import Link from "next/link";

import { CATEGORY_LOOK } from "@/constants/attraction-look";
import { messagesOf } from "@/constants/messages";
import type { Attraction } from "@/types/attraction";
import type { LanguageCode } from "@/constants/languages";

type AttractionCardProps = {
  attraction: Attraction;
  /** 지금 주소의 파라미터. 여기에 place 만 얹어 상세를 연다. */
  query: string;
  language: LanguageCode;
};

/**
 * 카드는 **버튼이 아니라 링크다.**
 *
 * 상세를 주소에 두면 뒤로가기로 닫는 것이 공짜로 따라온다. 서버 컴포넌트로
 * 남아 초기 HTML 에도 들어간다.
 *
 * **다만 그 링크를 새 탭이나 다른 사람에게 넘기면 지구본으로 떨어진다** —
 * `app/page.tsx` 가 문서 요청을 처음부터 시작하는 것으로 보고 되돌리기 때문이다.
 * 새로고침으로 초기화되는 것과 같은 판정이라 둘을 갈라낼 수 없다.
 */
export function AttractionCard({
  attraction,
  query,
  language,
}: AttractionCardProps) {
  const look = CATEGORY_LOOK[attraction.category];
  const messages = messagesOf(language);

  return (
    <Link
      href={`?${query}&place=${encodeURIComponent(attraction.id)}`}
      scroll={false}
      className="block overflow-hidden rounded-xl bg-white/5 transition-colors hover:bg-white/10"
    >
      <div className="relative aspect-4/3 w-full">
        {attraction.image ? (
          <Image
            src={attraction.image}
            alt=""
            fill
            // 패널이 최대 24rem 이고 두 칸이라 카드 하나가 이 정도다
            sizes="176px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            aria-hidden="true"
            className={`flex items-center justify-center h-full w-full text-2xl text-white/25 bg-gradient-to-br ${look.tint}`}
          >
            {look.mark}
          </div>
        )}
      </div>

      <div className="px-2.5 py-2">
        {/* 두 줄까지 보여주고 자른다 — 이름 길이가 들쭉날쭉해서 카드 높이가 흔들린다 */}
        <p className="text-xs leading-snug text-white/90 line-clamp-2">
          {attraction.name}
        </p>
        <p className="mt-1 text-[10px] text-white/35">
          {messages.categories[attraction.category]}
        </p>
      </div>
    </Link>
  );
}
