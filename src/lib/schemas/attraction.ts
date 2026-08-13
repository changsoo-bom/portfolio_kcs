import { z } from "zod";

/**
 * Overpass 응답 검증.
 *
 * 신뢰 경계를 넘는 지점이라 반드시 검증한다. 다만 **봉투와 항목을 따로 파싱한다** —
 * 배열 전체를 한 번에 통과시키면 이름 없는 항목 하나 때문에 200건이 통째로 버려진다.
 */
export const overpassResponseSchema = z.object({
  elements: z.array(z.unknown()),
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
 * 지도에서 넘어오는 검색 파라미터.
 *
 * 값이 이상하면 오류를 내지 않고 **없는 것으로 떨어뜨린다** — 주소창을 손으로
 * 고쳤다고 지구본까지 못 보게 만들 이유가 없다.
 */
export const mapSearchParamsSchema = z.object({
  region: z.string().min(1).max(32).optional().catch(undefined),
  // `node/240109189` 형태. 종류와 번호만 허용한다.
  place: z
    .string()
    .regex(/^(node|way|relation)\/\d+$/)
    .optional()
    .catch(undefined),
});
