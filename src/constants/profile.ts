/**
 * 사이트에 노출되는 원고. 문구를 고칠 때 컴포넌트를 열지 않게 여기 모아둔다.
 * 원본은 Obsidian `portfolio-kcs/05_Website/portfolio-자기소개.md`.
 */
export const PROFILE = {
  name: "김창수",
  role: "프론트엔드 개발자",
  /** portfolio-자기소개 §1 — B안 확정 */
  tagline: "HTML 퍼블리싱에서 시작해 지금은 AI와 함께 화면을 만듭니다.",
  concept: "THE FRONTEND EXPLORER",
  conceptSub: "Exploring the web, one interface at a time.",
  email: "chang9811@gmail.com",
  github: "https://github.com/changsoo-bom",
  // 전화번호는 넣지 않는다. 크롤러가 수집한다 — 이력서에만 (자기소개 §7)
} as const;

export const NAV_ITEMS = [
  { no: "01", label: "ABOUT", href: "/about" },
  { no: "02", label: "EXPERIENCE", href: "/experience" },
  { no: "03", label: "PROJECTS", href: "/work" },
  { no: "04", label: "TECH", href: "/tech" },
  { no: "05", label: "HOW I WORK", href: "/how-i-work" },
  { no: "06", label: "CONTACT", href: "/contact" },
] as const;

/** 페이지별 본문. 배열 한 칸이 한 문단이다. */
export const COPY = {
  about: {
    intro: [
      "프론트엔드를 할 때면 신비한 세계를 탐험하는 기분이 듭니다.",
      "HTML과 CSS로 백지 위에 요소를 하나씩 채우고 디자인이 입혀지는 순간을 좋아합니다. 패션 디자이너가 자기가 만든 옷에 애정을 갖듯, 저도 제가 만든 사이트에 애정을 갖게 됩니다.",
      "React와 Next.js를 익히고 나서는 그 껍데기에 생명을 불어넣는 감각을 알게 됐습니다. 화면이 비로소 살아 움직이는 순간이었습니다.",
      "기술이 발전하는 모습과 그 속에서 함께 성장하는 제 모습을 지켜보는 일이 즐겁습니다.",
    ],
    strength: {
      lead: "낯선 기술을 두려워하기보다 기회로 받아들입니다.",
      body: [
        "회사는 빠르게 바뀌는 기술을 따라가야 했지만 사내에 React를 다룰 줄 아는 사람이 없었습니다. 가로막힌 벽이 아니라 제가 먼저 열어야 할 문이라고 생각하고 그 역할을 자처했습니다.",
        "React 공식 문서를 꾸준히 모니터링하며 최신 변화를 직접 학습했습니다. 누가 알려주기를 기다리지 않고 부딪히며 익힌 결과, CJ 프로젝트 수준의 기술을 감당할 수 있게 됐고 그 실력을 인정받아 스카우트 제안을 받았습니다.",
      ],
    },
    weakness: {
      lead: "문제를 스스로 끝까지 해결하려는 고집이 있습니다.",
      body: [
        "'힘이나는 커피생활' 관리자 페이지를 개발하던 중 중복 로딩 버그를 만났는데, 혼자 해결하고 싶다는 욕심에 오래 붙들고 있다가 시간을 낭비한 적이 있습니다.",
        '그때 "15분 정도 혼자 고민해보고 실마리가 없으면 도움을 구하라"는 조언을 들었습니다. 내 고집 때문에 팀 전체가 피해를 볼 수 있다는 걸 그때 알았습니다. 지금은 그 기준으로 일합니다.',
      ],
    },
  },
  experience: {
    lead: "퍼블리싱에서 시작해 관리자 시스템 설계까지, 그리고 지금은 AI와 함께 개발합니다.",
  },
  tech: {
    lead: "기술을 나열하지 않고, 어떤 문제에 왜 썼는지로 정리했습니다.",
  },
  howIWork: {
    intro: [
      "회사에서 Claude Code를 개발 도구로 쓰면서 일하는 방식이 바뀌었습니다.",
      "코드를 대신 쓰게 하는 것보다, 무엇을 만들지 정확히 쓰고 나온 결과를 직접 검증하는 쪽에 시간이 더 들어갑니다.",
      "AI를 잘 쓰는 일은 결국 요구사항을 정확히 쓰는 일이었습니다.",
    ],
    key: [
      "중요한 건 AI GENERATION 다음의 세 단계입니다.",
      "요구 조건과 프롬프트를 상세히 쓰고 재검증을 충분히 거치면, 보안성과 인터랙티브한 UI/UX를 수준 높게 구현하면서 시간까지 아낄 수 있습니다.",
      "검토를 빼면 생산성만 오르고 완성도는 떨어집니다.",
    ],
  },
  contact: {
    lead: "연락 주시면 빠르게 답장드립니다.",
  },
} as const;
