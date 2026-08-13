import type { LanguageCode } from "@/constants/languages";
import type { AttractionCategory } from "@/types/attraction";

/**
 * 화면에 그대로 나가는 문구.
 *
 * 지도 라벨과 지역·명소 이름은 데이터가 언어별로 들고 있는데, **UI 문구만
 * 한국어로 박혀 있었다.** 언어를 바꿔도 "박물관"·"구글 검색"이 그대로 남아
 * 절반만 번역된 화면이 됐다.
 *
 * 라이브러리를 들이지 않은 이유는 언어가 이미 주소에 있고 서버·클라이언트
 * 양쪽에 흘러가고 있기 때문이다. 표 하나면 된다.
 */
type Messages = {
  title: string;
  close: string;
  settings: string;

  zoomIn: string;
  zoomOut: string;
  zoomLevel: string;

  country: string;
  region: string;
  goTo: string;
  reset: string;
  /** 아무 구역이나 데려가는 버튼. */
  surprise: string;
  search: string;
  noMatch: string;

  searching: string;
  /** 개수는 언어마다 붙는 자리가 달라서 문장째로 만든다. */
  places: (count: number) => string;
  /** 분류 칩의 "전체". */
  all: string;
  empty: string;
  unavailable: string;

  address: string;
  locating: string;
  openingHours: string;
  phone: string;
  website: string;
  coordinates: string;

  googleSearch: string;
  wikipedia: string;

  categories: Record<AttractionCategory, string>;
};

export const MESSAGES: Record<LanguageCode, Messages> = {
  ko: {
    title: "세계 명소 탐색 지도",
    close: "닫기",
    settings: "설정",
    zoomIn: "확대",
    zoomOut: "축소",
    zoomLevel: "지도 배율",
    country: "나라",
    region: "지역",
    goTo: "바로가기",
    reset: "초기화",
    surprise: "아무 데나",
    search: "검색",
    noMatch: "결과 없음",

    searching: "찾는 중…",
    places: (count) => `${count}곳`,
    all: "전체",
    empty: "이 구역에서 찾은 명소가 없습니다.",
    unavailable: "지금은 명소를 불러오지 못했습니다. 잠시 뒤에 다시 시도해 주세요.",
    address: "주소",
    locating: "좌표로 찾는 중…",
    openingHours: "영업시간",
    phone: "전화",
    website: "웹사이트",
    coordinates: "좌표",
    googleSearch: "구글 검색",
    wikipedia: "위키백과",
    categories: {
      attraction: "명소",
      museum: "박물관",
      viewpoint: "전망",
      theme_park: "테마파크",
      zoo: "동물원",
      aquarium: "아쿠아리움",
      artwork: "조형물",
      gallery: "갤러리",
    },
  },

  en: {
    title: "World attractions map",
    close: "Close",
    settings: "Settings",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    zoomLevel: "Zoom level",
    country: "Country",
    region: "Region",
    goTo: "Go",
    reset: "Reset",
    surprise: "Surprise me",
    search: "Search",
    noMatch: "No matches",

    searching: "SEARCHING…",
    places: (count) => `${count} PLACES`,
    all: "All",
    empty: "No places found in this area.",
    unavailable: "Couldn't load places right now. Try again in a moment.",
    address: "Address",
    locating: "Looking up…",
    openingHours: "Hours",
    phone: "Phone",
    website: "Website",
    coordinates: "Coordinates",
    googleSearch: "Google Search",
    wikipedia: "Wikipedia",
    categories: {
      attraction: "Attraction",
      museum: "Museum",
      viewpoint: "Viewpoint",
      theme_park: "Theme park",
      zoo: "Zoo",
      aquarium: "Aquarium",
      artwork: "Artwork",
      gallery: "Gallery",
    },
  },

  ja: {
    title: "世界の名所地図",
    close: "閉じる",
    settings: "設定",
    zoomIn: "拡大",
    zoomOut: "縮小",
    zoomLevel: "地図の倍率",
    country: "国",
    region: "地域",
    goTo: "移動",
    reset: "リセット",
    surprise: "おまかせ",
    search: "検索",
    noMatch: "該当なし",

    searching: "検索中…",
    places: (count) => `${count}件`,
    all: "すべて",
    empty: "この地域では名所が見つかりませんでした。",
    unavailable:
      "今は名所を読み込めませんでした。少ししてからもう一度お試しください。",
    address: "住所",
    locating: "座標から検索中…",
    openingHours: "営業時間",
    phone: "電話",
    website: "ウェブサイト",
    coordinates: "座標",
    googleSearch: "Google 検索",
    wikipedia: "ウィキペディア",
    categories: {
      attraction: "名所",
      museum: "博物館",
      viewpoint: "展望",
      theme_park: "テーマパーク",
      zoo: "動物園",
      aquarium: "水族館",
      artwork: "芸術作品",
      gallery: "ギャラリー",
    },
  },

  zh: {
    title: "世界景点地图",
    close: "关闭",
    settings: "设置",
    zoomIn: "放大",
    zoomOut: "缩小",
    zoomLevel: "地图缩放",
    country: "国家",
    region: "地区",
    goTo: "前往",
    reset: "重置",
    surprise: "随便逛逛",
    search: "搜索",
    noMatch: "无结果",

    searching: "搜索中…",
    places: (count) => `${count} 个地点`,
    all: "全部",
    empty: "在该地区没有找到景点。",
    unavailable: "暂时无法加载景点，请稍后再试。",
    address: "地址",
    locating: "正在根据坐标查找…",
    openingHours: "营业时间",
    phone: "电话",
    website: "网站",
    coordinates: "坐标",
    googleSearch: "Google 搜索",
    wikipedia: "维基百科",
    categories: {
      attraction: "景点",
      museum: "博物馆",
      viewpoint: "观景点",
      theme_park: "主题公园",
      zoo: "动物园",
      aquarium: "水族馆",
      artwork: "艺术品",
      gallery: "画廊",
    },
  },

  es: {
    title: "Mapa de lugares del mundo",
    close: "Cerrar",
    settings: "Ajustes",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    zoomLevel: "Nivel de zoom",
    country: "País",
    region: "Región",
    goTo: "Ir",
    reset: "Restablecer",
    surprise: "Sorpréndeme",
    search: "Buscar",
    noMatch: "Sin resultados",

    searching: "BUSCANDO…",
    places: (count) => `${count} LUGARES`,
    all: "Todo",
    empty: "No se encontraron lugares en esta zona.",
    unavailable:
      "No se pudieron cargar los lugares. Inténtalo de nuevo en un momento.",
    address: "Dirección",
    locating: "Buscando…",
    openingHours: "Horario",
    phone: "Teléfono",
    website: "Sitio web",
    coordinates: "Coordenadas",
    googleSearch: "Buscar en Google",
    wikipedia: "Wikipedia",
    categories: {
      attraction: "Atracción",
      museum: "Museo",
      viewpoint: "Mirador",
      theme_park: "Parque temático",
      zoo: "Zoológico",
      aquarium: "Acuario",
      artwork: "Obra de arte",
      gallery: "Galería",
    },
  },

  fr: {
    title: "Carte des lieux du monde",
    close: "Fermer",
    settings: "Paramètres",
    zoomIn: "Zoom avant",
    zoomOut: "Zoom arrière",
    zoomLevel: "Niveau de zoom",
    country: "Pays",
    region: "Région",
    goTo: "Aller",
    reset: "Réinitialiser",
    surprise: "Au hasard",
    search: "Rechercher",
    noMatch: "Aucun résultat",

    searching: "RECHERCHE…",
    places: (count) => `${count} LIEUX`,
    all: "Tout",
    empty: "Aucun lieu trouvé dans cette zone.",
    unavailable:
      "Impossible de charger les lieux pour le moment. Réessayez dans un instant.",
    address: "Adresse",
    locating: "Recherche…",
    openingHours: "Horaires",
    phone: "Téléphone",
    website: "Site web",
    coordinates: "Coordonnées",
    googleSearch: "Recherche Google",
    wikipedia: "Wikipédia",
    categories: {
      attraction: "Site",
      museum: "Musée",
      viewpoint: "Point de vue",
      theme_park: "Parc à thème",
      zoo: "Zoo",
      aquarium: "Aquarium",
      artwork: "Œuvre d'art",
      gallery: "Galerie",
    },
  },

  de: {
    title: "Weltkarte der Sehenswürdigkeiten",
    close: "Schließen",
    settings: "Einstellungen",
    zoomIn: "Vergrößern",
    zoomOut: "Verkleinern",
    zoomLevel: "Zoomstufe",
    country: "Land",
    region: "Region",
    goTo: "Los",
    reset: "Zurücksetzen",
    surprise: "Überrasch mich",
    search: "Suchen",
    noMatch: "Keine Treffer",

    searching: "SUCHE…",
    places: (count) => `${count} ORTE`,
    all: "Alle",
    empty: "In diesem Gebiet wurden keine Orte gefunden.",
    unavailable:
      "Die Orte konnten gerade nicht geladen werden. Versuchen Sie es gleich noch einmal.",
    address: "Adresse",
    locating: "Wird gesucht…",
    openingHours: "Öffnungszeiten",
    phone: "Telefon",
    website: "Website",
    coordinates: "Koordinaten",
    googleSearch: "Google-Suche",
    wikipedia: "Wikipedia",
    categories: {
      attraction: "Sehenswürdigkeit",
      museum: "Museum",
      viewpoint: "Aussichtspunkt",
      theme_park: "Freizeitpark",
      zoo: "Zoo",
      aquarium: "Aquarium",
      artwork: "Kunstwerk",
      gallery: "Galerie",
    },
  },

  ru: {
    title: "Карта достопримечательностей мира",
    close: "Закрыть",
    settings: "Настройки",
    zoomIn: "Приблизить",
    zoomOut: "Отдалить",
    zoomLevel: "Масштаб карты",
    country: "Страна",
    region: "Регион",
    goTo: "Перейти",
    reset: "Сброс",
    surprise: "Наугад",
    search: "Поиск",
    noMatch: "Ничего не найдено",

    searching: "ПОИСК…",
    places: (count) => `${count} МЕСТ`,
    all: "Все",
    empty: "В этом районе мест не найдено.",
    unavailable: "Сейчас не удалось загрузить места. Попробуйте чуть позже.",
    address: "Адрес",
    locating: "Определяем…",
    openingHours: "Часы работы",
    phone: "Телефон",
    website: "Сайт",
    coordinates: "Координаты",
    googleSearch: "Поиск в Google",
    wikipedia: "Википедия",
    categories: {
      attraction: "Достопримечательность",
      museum: "Музей",
      viewpoint: "Смотровая площадка",
      theme_park: "Парк развлечений",
      zoo: "Зоопарк",
      aquarium: "Аквариум",
      artwork: "Арт-объект",
      gallery: "Галерея",
    },
  },

  pt: {
    title: "Mapa de atrações do mundo",
    close: "Fechar",
    settings: "Configurações",
    zoomIn: "Aproximar",
    zoomOut: "Afastar",
    zoomLevel: "Nível de zoom",
    country: "País",
    region: "Região",
    goTo: "Ir",
    reset: "Redefinir",
    surprise: "Surpreenda-me",
    search: "Buscar",
    noMatch: "Sem resultados",

    searching: "BUSCANDO…",
    places: (count) => `${count} LUGARES`,
    all: "Tudo",
    empty: "Nenhum lugar encontrado nesta área.",
    unavailable:
      "Não foi possível carregar os lugares agora. Tente novamente em instantes.",
    address: "Endereço",
    locating: "Buscando…",
    openingHours: "Horário",
    phone: "Telefone",
    website: "Site",
    coordinates: "Coordenadas",
    googleSearch: "Buscar no Google",
    wikipedia: "Wikipédia",
    categories: {
      attraction: "Atração",
      museum: "Museu",
      viewpoint: "Mirante",
      theme_park: "Parque temático",
      zoo: "Zoológico",
      aquarium: "Aquário",
      artwork: "Obra de arte",
      gallery: "Galeria",
    },
  },

  vi: {
    title: "Bản đồ điểm đến thế giới",
    close: "Đóng",
    settings: "Cài đặt",
    zoomIn: "Phóng to",
    zoomOut: "Thu nhỏ",
    zoomLevel: "Mức thu phóng",
    country: "Quốc gia",
    region: "Vùng",
    goTo: "Đi tới",
    reset: "Đặt lại",
    surprise: "Ngẫu nhiên",
    search: "Tìm kiếm",
    noMatch: "Không có kết quả",

    searching: "ĐANG TÌM…",
    places: (count) => `${count} ĐỊA ĐIỂM`,
    all: "Tất cả",
    empty: "Không tìm thấy địa điểm nào trong khu vực này.",
    unavailable: "Hiện chưa tải được địa điểm. Hãy thử lại sau giây lát.",
    address: "Địa chỉ",
    locating: "Đang tra cứu…",
    openingHours: "Giờ mở cửa",
    phone: "Điện thoại",
    website: "Trang web",
    coordinates: "Tọa độ",
    googleSearch: "Tìm trên Google",
    wikipedia: "Wikipedia",
    categories: {
      attraction: "Điểm tham quan",
      museum: "Bảo tàng",
      viewpoint: "Điểm ngắm cảnh",
      theme_park: "Công viên giải trí",
      zoo: "Vườn thú",
      aquarium: "Thủy cung",
      artwork: "Tác phẩm nghệ thuật",
      gallery: "Phòng tranh",
    },
  },
};

export const messagesOf = (language: LanguageCode) => MESSAGES[language];
