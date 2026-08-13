/**
 * 나라 이름 표를 만들어 `public/country-names.json` 으로 쓴다.
 *
 * 왜 필요한가 — 지도 타일(demotiles)의 나라 피처에는 이름이 **영어 하나(NAME)뿐**이다.
 * 지명 라벨과 행정구역 툴팁은 언어를 따라가는데 나라 툴팁만 영어로 남으면
 * 한 화면 안에서 언어가 섞인다.
 *
 * 출처: Natural Earth 1:50m Admin 0 (public domain).
 * demotiles 도 Natural Earth 계열이라 ADM0_A3 코드가 그대로 맞아떨어진다.
 * 50m 은 110m 의 상위 집합이라 demotiles 에 나오는 코드를 빠짐없이 덮는다.
 *
 * 지오메트리는 버리고 이름만 남기므로 결과는 수십 KB 다.
 *
 *   node scripts/build-country-names.mjs
 */
import { writeFileSync } from "node:fs";

import { LANGUAGES } from "../src/constants/languages.ts";

const SOURCE =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";
/**
 * 같은 표를 두 군데에 쓴다.
 *
 * `public/` 은 지도(클라이언트)가 실행 중에 받아 가는 것이고, `src/data/` 는
 * 서버가 나라 목록을 그릴 때 바로 import 하는 것이다. 클라이언트가 import 하면
 * 50KB 가 번들에 얹히고, 서버가 fetch 하면 자기 자신에게 요청을 보내야 한다.
 */
const DESTS = [
  new URL("../public/country-names.json", import.meta.url),
  new URL("../src/data/country-names.json", import.meta.url),
];

const CODES = LANGUAGES.map((language) => language.code);

console.log("downloading…");
const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
const source = await response.json();

/** ADM0_A3 → { ko: "대한민국", en: "South Korea", … } */
const table = {};

for (const feature of source.features) {
  const properties = feature.properties;
  // 대소문자가 스케일마다 다르다 — 둘 다 본다
  const key = properties.ADM0_A3 ?? properties.adm0_a3;
  if (!key) continue;

  const names = {};
  for (const code of CODES) {
    const value = properties[`NAME_${code.toUpperCase()}`] ?? properties[`name_${code}`];
    if (value) names[code] = value;
  }
  if (Object.keys(names).length > 0) table[key] = names;
}

const json = JSON.stringify(table);
for (const dest of DESTS) writeFileSync(dest, json);
console.log(`${Object.keys(table).length} countries -> ${DESTS.length} files`);
