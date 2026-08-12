/**
 * 지도에서 고를 수 있는 언어.
 *
 * **세 데이터 소스가 모두 가진 언어만 넣는다.** 지명 라벨은 OpenMapTiles,
 * 행정구역 툴팁은 Natural Earth admin-1, 나라 툴팁은 Natural Earth admin-0 에서
 * 오는데, 하나라도 빠지면 한 화면 안에서 언어가 섞인다.
 *
 * 아랍어는 뺐다. 세 소스 모두 갖고 있고 폰트에도 들어 있지만, MapLibre 에서
 * 라벨 글자가 제대로 이어지려면 RTL 플러그인을 따로 올려야 한다.
 *
 * 이 목록은 `scripts/build-admin1.mjs` 와 `scripts/build-country-names.mjs`
 * 에서도 그대로 읽는다 — 여기만 고치면 데이터까지 따라온다.
 */
export const LANGUAGES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ru", label: "Русский" },
  { code: "pt", label: "Português" },
  { code: "vi", label: "Tiếng Việt" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: LanguageCode = "ko";

/** 고른 언어에 이름이 없을 때 떨어질 곳. 영어까지 없으면 원어를 쓴다. */
export const FALLBACK_LANGUAGE: LanguageCode = "en";
