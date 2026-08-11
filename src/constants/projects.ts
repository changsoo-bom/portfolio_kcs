import type { Project } from "@/types/project";

/**
 * 원본은 Obsidian `portfolio-kcs/01_Projects/*.md`의 frontmatter,
 * `summary`는 `portfolio-자기소개.md` §4의 카드 한 줄이다.
 *
 * 파일이 5개뿐이라 빌드 타임 마크다운 파싱 대신 상수로 둔다 (portfolio-기획 §프로젝트 데이터 모델).
 * 늘어나면 파싱으로 바꾼다.
 *
 * `period`가 빈 값인 프로젝트가 넷이다 — 확인 전이라 지어내지 않는다.
 */
export const PROJECTS: readonly Project[] = [
  {
    id: "hanwha-q-partners",
    title: "Hanwha Q.partners",
    company: "인터플러그",
    period: "",
    visibility: "case-study",
    order: 1,
    tech: [
      "Next.js",
      "React 19.2",
      "TypeScript",
      "Tailwind CSS",
      "Zustand",
      "React Query",
      "Claude Code",
    ],
    summary:
      "React 19.2 기반 화면 구현. Claude Code를 개발 도구로 활용해 반복 작업을 줄이고 결과물을 직접 검증했습니다.",
  },
  {
    id: "coffee-life-bo",
    title: "힘이나는 커피생활 BO",
    company: "인터플러그",
    period: "2025-08 ~ 2025-11",
    visibility: "development",
    order: 2,
    tech: ["Next.js", "SCSS", "React Query", "Zustand", "REST API"],
    summary:
      "관리자 백오피스를 처음부터 설계·구축. 목록·검색·필터가 얽힌 화면 흐름을 끊김 없이 만들었습니다.",
  },
  {
    id: "hanasys-design",
    title: "HANASYS DESIGN",
    company: "인터플러그",
    period: "",
    visibility: "restricted",
    order: 3,
    tech: ["React.js", "SCSS", "Zustand"],
    summary: "반복되는 마크업을 컴포넌트로 정리해 재사용성을 높였습니다.",
  },
  {
    id: "cj-freshway",
    title: "CJ FreshWay",
    company: "인터플러그",
    period: "",
    visibility: "case-study",
    order: 4,
    tech: ["React.js", "SCSS"],
    summary:
      "모바일·태블릿·웹 3개 디바이스 반응형을 개선해 UI 깨짐을 해소하고 화면 일관성을 확보했습니다.",
  },
  {
    id: "kpanet",
    title: "대한약사회",
    company: "코아메소드",
    period: "",
    visibility: "case-study",
    order: 5,
    tech: ["HTML5", "CSS3", "JavaScript"],
    summary:
      "웹 표준(W3C)을 지키고 지부 사이트를 표준 템플릿으로 묶어 유지보수 효율을 개선했습니다.",
  },
];
