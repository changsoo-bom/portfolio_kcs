/**
 * 원본은 Obsidian `portfolio-kcs/portfolio-자기소개.md` §5.
 * 숙련도 별점·퍼센트 바를 쓰지 않는다 — 어디에 왜 썼는지로 대신한다.
 */
export const TECH_STACK = [
  {
    name: "HTML · CSS · JS",
    copy: "백지에서 화면을 세우는 단계. 웹 표준과 반응형의 기준을 여기서 잡았습니다.",
  },
  {
    name: "React",
    copy: "사내에 다룰 사람이 없을 때 공식 문서로 직접 익혔습니다. 반복 UI를 컴포넌트로 정리합니다.",
  },
  {
    name: "Next.js",
    copy: "화면 수가 많고 데이터 연동이 얽히는 프로젝트에서 씁니다. 관리자 시스템을 여기서 만들었습니다.",
  },
  {
    name: "TypeScript",
    copy: "API 응답과 props의 모양을 고정해, 런타임이 아니라 에디터에서 먼저 깨지게 만듭니다.",
  },
  {
    name: "Tailwind CSS",
    copy: "디자인 토큰을 한 곳에 두고 조합합니다. 안 쓰는 스타일이 남지 않습니다.",
  },
  {
    name: "Zustand",
    copy: "서버와 무관한 UI 상태만 담습니다. 서버 데이터는 복사하지 않습니다.",
  },
  {
    name: "React Query",
    copy: "서버 데이터·캐싱·재요청을 맡깁니다. 목록 화면에서 특히 큽니다.",
  },
  {
    name: "Claude Code",
    copy: "코드 생성기가 아니라 개발 프로세스의 한 단계로 씁니다.",
  },
] as const;
