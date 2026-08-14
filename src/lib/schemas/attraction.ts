import { z } from "zod";

import { ATTRACTION_CATEGORIES } from "@/types/attraction";

/**
 * Overpass 응답 검증.
 *
 * 신뢰 경계를 넘는 지점이라 반드시 검증한다. 다만 **봉투와 항목을 따로 파싱한다** —
 * 배열 전체를 한 번에 통과시키면 이름 없는 항목 하나 때문에 200건이 통째로 버려진다.
 */
export const overpassResponseSchema = z.object({
  elements: z.array(z.unknown()),
  /**
   * **Overpass 는 실패도 200 으로 준다.** 서버가 바빠 질의를 못 끝내면
   * `elements` 를 빈 채로 두고 여기에 사유를 적어 보낸다 — 이걸 안 보면
   * "명소가 하나도 없는 구역" 으로 읽고, 그 빈 목록이 하루치 캐시에 박힌다.
   */
  remark: z.string().optional(),
});

const center = z.object({ lat: z.number(), lon: z.number() });

export const overpassElementSchema = z.object({
  type: z.string(),
  id: z.number(),
  // 점(node)은 좌표를 직접 갖고, 선·면(way·relation)은 `out center` 가 준 중심점을 쓴다
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: center.optional(),
  tags: z.record(z.string(), z.string()).optional(),
});

/**
 * Wikidata 엔티티 응답 중 **대표 이미지(P18)로 가는 경로만** 훑는다.
 * 나머지 수백 개 속성까지 스키마로 옮길 이유가 없다.
 */
export const wikidataEntitiesSchema = z.object({
  entities: z
    .record(
      z.string(),
      z.object({
        claims: z
          .object({
            P18: z
              .array(
                z.object({
                  mainsnak: z
                    .object({
                      datavalue: z
                        .object({ value: z.unknown() })
                        .optional(),
                    })
                    .optional(),
                }),
              )
              .optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

/**
 * Nominatim 역지오코딩 응답.
 *
 * **`display_name` 을 쓰지 않는다** — 그건 작은 단위부터 늘어놓은 문자열이라
 * 한국어 주소 순서와 반대다. 조각(`address`)을 받아 직접 잇는다.
 * 좌표를 못 짚으면 `{ error: ... }` 만 오므로 둘 다 optional 이다.
 */
export const nominatimReverseSchema = z.object({
  address: z.record(z.string(), z.string()).optional(),
});

/**
 * 지도에서 넘어오는 검색 파라미터.
 *
 * 값이 이상하면 오류를 내지 않고 **없는 것으로 떨어뜨린다** — 주소창을 손으로
 * 고쳤다고 지구본까지 못 보게 만들 이유가 없다.
 */
export const mapSearchParamsSchema = z.object({
  /**
   * Natural Earth 의 `adm1_code`. `KOR-2496` 이 보통이고 이름 없는 구역은
   * `PFA+00?` 처럼 온다. 4584개 전부가 이 모양이다.
   *
   * **모양을 안 보면 500 이 난다.** 구역 표는 번들러가 만든 일반 객체라
   * `Object.prototype` 이 붙어 있어서, `region=constructor` 면 조회 결과가
   * 함수(truthy)로 나와 없는 값 가드를 그냥 통과하고 그 다음 줄에서 터진다.
   */
  region: z
    .string()
    .regex(/^[A-Z]{3}[-+][A-Z0-9?]{1,12}$/)
    .optional()
    .catch(undefined),
  // ADM0_A3. 세 글자 코드만 받는다.
  country: z
    .string()
    .regex(/^[A-Z0-9]{3}$/)
    .optional()
    .catch(undefined),
  // `node/240109189` 형태. 종류와 번호만 허용한다.
  place: z
    .string()
    .regex(/^(node|way|relation)\/\d+$/)
    .optional()
    .catch(undefined),
  /**
   * 명소 분류. 목록에 없는 값은 **없는 것으로 떨어진다** — 이상한 값 때문에
   * 빈 목록을 보여주느니 전체를 보여주는 게 낫다.
   */
  category: z
    .enum(ATTRACTION_CATEGORIES)
    .optional()
    .catch(undefined),
});
