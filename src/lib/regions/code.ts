/**
 * 구역 코드를 다루는 순수 함수.
 *
 * **표를 읽는 쪽(`./index.ts`)과 파일을 갈라 둔다.** 거기는 나라·구역 이름표
 * 1.3MB 를 import 하고 `server-only` 로 잠겨 있어서, 클라이언트가 코드 한 조각을
 * 떼려고 그 모듈을 건드리면 빌드가 깨진다. 이쪽은 데이터가 없어 양쪽이 같이 쓴다.
 */

/**
 * 구역 id 앞 세 글자가 나라 코드다 — Natural Earth 의 `adm1_code` 가
 * `KOR-2496` 처럼 나라 코드로 시작한다. 이름 없는 구역이 `PFA+00?` 로
 * 오기도 하는데 앞 세 글자는 그대로다.
 */
export const countryOf = (region: string) => region.slice(0, 3);
