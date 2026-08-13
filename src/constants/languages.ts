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
 * 에서도 그대로 읽는다. **다만 저절로 따라오지는 않는다** — 언어를 더하면
 * `pnpm build:admin1` 과 `pnpm build:country-names` 를 다시 돌려야 이름표에
 * 그 언어가 들어간다. 안 돌리면 화면만 새 언어로 바뀌고 지명은 영어로 남는다.
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

/**
 * 타입 술어로 쓴다. `Set.has()` 는 타입을 좁혀 주지 못해서, 그걸 쓰면
 * 결국 `as` 단언이 따라붙는다 — 규칙이 금지하는 그것이다.
 */
const isLanguage = (value: string): value is LanguageCode =>
  LANGUAGES.some((language) => language.code === value);

/**
 * 주소에서 온 값을 언어로 바꾼다. 모르는 값이면 기본 언어다.
 *
 * **서버와 클라이언트가 같은 판정을 써야 한다.** 예전에는 이 검사가 페이지와
 * 훅에 각각 복사돼 있어서, 목록에 언어를 하나 더하면 두 곳을 다 고쳐야 했다.
 */
export function languageOf(raw: unknown): LanguageCode {
  return typeof raw === "string" && isLanguage(raw) ? raw : DEFAULT_LANGUAGE;
}

/** 고른 언어에 이름이 없을 때 떨어질 곳. 영어까지 없으면 원어를 쓴다. */
export const FALLBACK_LANGUAGE: LanguageCode = "en";
