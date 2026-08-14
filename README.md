# World Atlas

지구본에서 나라와 지역을 따라 들어가 그 지역의 명소를 찾는 지도입니다.

전 세계 **4,584개 행정구역**을 대상으로 합니다. 나라를 누르면 그 안의 지역이 갈라지고,
지역을 누르면 오른쪽에 명소 목록이 열립니다. 명소 정보는 모두 공개 데이터에서 옵니다.

| | |
|---:|:---|
| **4,584** | 탐색 가능한 행정구역 |
| **10** | 지원 언어 |
| **0** | 필요한 API 키 |
| **1회** | 구역당 하루 외부 호출 |

---

## 화면

- **지구본** — MapLibre GL 의 globe 투영. 배경은 three.js 로 그린 별하늘 4,200개
- **나라 · 지역 필터** — 고른 값이 전부 주소(`searchParams`)에 들어갑니다
- **명소 패널** — 분류 칩으로 걸러 보고, 카드에 커서를 올리면 지도의 점이 커집니다
- **주사위** — 어디를 볼지 모를 때 아무 구역이나 데려갑니다
- **/about** — 이 지도를 무엇으로 왜 그렇게 만들었는지 정리한 한 장

## 기술 스택

| | |
|---|---|
| **Next.js 16** | App Router · 서버 컴포넌트 · 데이터 캐시 |
| **React 19.2** | React Compiler · Suspense 경계 |
| **TypeScript 5** | strict · `any` 금지 |
| **MapLibre GL 6** | 지구본 투영 · 벡터/래스터 레이어 · 호버 판정 |
| **three.js** | 배경 별하늘 (커스텀 셰이더 · 블룸) |
| **anime.js 4** | 첫 진입 인트로 커튼 |
| **Tailwind CSS 4** | 설정 파일 없이 CSS 토큰으로 |
| **Zod 4** | 외부 응답과 주소 파라미터 검증 |

패키지 매니저는 **pnpm** 입니다.

## 데이터 출처

| 출처 | 쓰임 | 라이선스 |
|---|---|---|
| [OpenStreetMap — Overpass](https://overpass-api.de/) | 명소 (`tourism` 8종) | ODbL |
| [EOX Sentinel-2 cloudless](https://s2maps.eu) | 위성 사진 | **CC BY-NC-SA 4.0 · 비상업** |
| [OpenFreeMap](https://openfreemap.org/) | 도로 · 경계 · 지명 타일 | ODbL |
| [Natural Earth 1:10m](https://www.naturalearthdata.com/) | 행정구역 폴리곤 4,584개 | Public domain |
| [Wikidata · Wikimedia Commons](https://www.wikidata.org/) | 명소 사진 | 출처 표기 |
| [Nominatim](https://nominatim.org/) | 주소가 없는 명소의 역지오코딩 | ODbL |

> **위성 사진은 비상업 이용 조건입니다.** 상업적으로 쓰려면 다른 타일로 교체해야 합니다.
> 지도 오른쪽 아래 (i) 를 누르면 표시 의무가 있는 출처가 모두 나옵니다.
> 이 저작자 표시는 법적 요구사항이라 제거하면 안 됩니다.

## 시작하기

Node.js 20 이상과 pnpm 이 필요합니다.

```bash
pnpm install     # 의존성 설치 (MapLibre 워커를 public/ 으로 복사하는 postinstall 포함)
pnpm dev         # 개발 서버 (Turbopack)
pnpm build       # 프로덕션 빌드
pnpm start       # 프로덕션 서버
pnpm lint        # ESLint
```

환경 변수는 없습니다. **API 키 없이 그대로 돌아갑니다.**

### 지도 데이터 생성

행정구역 폴리곤과 이름표는 저장소에 이미 들어 있습니다. Natural Earth 판이 올라가서
다시 만들어야 할 때만 실행하세요.

```bash
pnpm build:admin1         # public/admin1/*.geojson · admin1-labels.geojson · region-index.json
pnpm build:country-names  # public/country-names.json
```

## 프로젝트 구조

```
src/
├── app/                    # 라우팅 전용 (얇게 유지)
│   ├── page.tsx            #   지구본 + 필터 + 명소 패널 조립
│   └── about/page.tsx      #   프로젝트 소개
├── components/
│   ├── ui/                 # 전역 프리미티브
│   ├── common/             # 공통 조합 컴포넌트
│   └── world/{기능}/       # 지도 · 명소 · 배경
├── hooks/                  # use-*.ts 클라이언트 훅
├── lib/
│   ├── overpass/           #   명소 조회 (미러 폴백 · 하루 캐시)
│   ├── regions/            #   구역 표 조회 · 폴리곤 판정 (server-only)
│   ├── nominatim/          #   역지오코딩
│   └── schemas/            #   Zod 스키마
├── types/ · constants/     # 도메인 타입 · 10개 언어 문구
└── data/                   # 구역 색인 (생성물)

scripts/                    # Natural Earth → 지도 데이터 생성
public/admin1/              # 나라별 행정구역 폴리곤
```

레이어는 `types → schemas → lib → components → app` 순으로 한 방향으로만 흐릅니다.

## 만들면서 내린 결정

**명소 조회를 서버에 둔 이유는 캐시입니다.** Overpass 는 공용 무료 서버라 호출량 제한이
있습니다. 브라우저에서 부르면 방문자 수만큼 그대로 나가지만, 서버에서 부르고 하루 단위로
캐시하면 구역당 하루 한 번으로 줄어듭니다.

**화면 상태를 주소에 담았습니다.** 고른 나라 · 구역 · 분류 · 언어가 전부 검색 파라미터에
있습니다. 그래서 지도를 눌러 고르든 위쪽 필터에서 고르든 같은 곳을 보고, 한쪽을 다른 쪽에
맞춰 주는 코드가 필요 없습니다.

**경계선과 칠을 같은 자료에서 뽑습니다.** 선을 OpenStreetMap 에서, 칠을 Natural Earth 에서
가져왔더니 두 자료의 행정구역 구분이 다른 나라가 있었습니다 — 케냐는 8개 주가 47개 카운티로
개편됐습니다.

**명소는 상자가 아니라 구역 경계로 거릅니다.** Overpass 는 사각형으로만 물어볼 수 있는데
구역은 사각형이 아닙니다. 4,584개 구역이 제 상자를 채우는 비율은 중앙값이 52% 라, 서울을
열면 부천과 남한산성이 섞여 들어왔습니다.

**링크가 되는 값은 화면이 아니라 입구에서 거릅니다.** OpenStreetMap 태그는 누구나 편집할
수 있는데 그 값이 그대로 링크 주소가 됩니다. 데이터를 받는 한 곳에서 스킴과 모양을 확인한
값만 내보냅니다.

더 자세한 내용은 [/about](src/app/about/page.tsx) 페이지에 있습니다.

## 개발 규칙

코딩 컨벤션 · 폴더 구조 · React 경계 · 스타일링 · 데이터 · 상태 관리 규칙은
[`.claude/rules/`](.claude/rules/) 에 나뉘어 있습니다.

작업을 마치면 **린트 → 타입체크 → 빌드**를 확인합니다.

```
<type>: <subject>     # feat / fix / refactor / style / docs / chore / test
```

접두사는 영어, 본문은 한국어로 씁니다.
