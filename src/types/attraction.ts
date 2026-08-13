/** OSM `tourism` 태그 중 명소로 취급할 값. 질의 필터와 화면 분류가 같은 목록을 쓴다. */
export const ATTRACTION_CATEGORIES = [
  "attraction",
  "museum",
  "viewpoint",
  "theme_park",
  "zoo",
  "aquarium",
  "artwork",
  "gallery",
] as const;

export type AttractionCategory = (typeof ATTRACTION_CATEGORIES)[number];

export type Attraction = {
  /** `node/123` 처럼 종류와 번호를 합친 값. 같은 장소가 node·way 로 둘 다 있을 수 있다. */
  id: string;
  name: string;
  category: AttractionCategory;
  lng: number;
  lat: number;
  /** 있으면 카드에 깔린다. 없는 쪽이 기본이라 화면이 이걸 전제하면 안 된다. */
  image?: string;
  /** 사진을 뒤늦게 채우는 데만 쓴다. 화면에는 나가지 않는다. */
  wikidata?: string;

  /**
   * 상세 모달에 쓰는 값들. **전부 이미 받은 응답 안에 있다** — 카드를 눌러도
   * 요청이 새로 나가지 않는다. OSM 은 태그가 있는 곳과 없는 곳의 차이가 커서
   * 하나도 없는 경우가 흔하다.
   */
  description?: string;
  address?: string;
  website?: string;
  phone?: string;
  openingHours?: string;
  /** `ko:경복궁` 형태. 언어 접두사를 떼어 주소를 만든다. */
  wikipedia?: string;
};

/**
 * 지도에 점 하나를 찍는 데 필요한 만큼.
 *
 * 마커는 클라이언트로 넘어가므로 **서버에서 여기까지 깎아서 보낸다.**
 * 설명·주소·사진까지 실어 보내면 화면에 안 쓰는 값이 전송량만 키운다.
 */
export type AttractionPoint = Pick<Attraction, "id" | "name" | "lng" | "lat">;

/**
 * 목록 결과. **빈 목록과 실패를 구분한다** — 둘 다 카드가 0장이지만
 * 사용자에게 할 말이 다르다.
 */
export type AttractionResult = {
  status: "ok" | "unavailable";
  attractions: Attraction[];
};

/** 지도에서 고른 구역. `src/data/region-bbox.json` 의 키가 곧 id 다. */
export type RegionBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};
