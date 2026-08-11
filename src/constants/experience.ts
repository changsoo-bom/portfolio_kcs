/**
 * 원본은 Obsidian `portfolio-kcs/portfolio-자기소개.md` §3, 사실 데이터는 `00_Profile/Career.md`.
 * 화면에는 성장 축만 보여주고 상세는 프로젝트로 넘긴다.
 */
export const CAREER = [
  {
    year: "2022",
    company: "코아메소드",
    team: "UI/UX 개발팀",
    stack: "HTML5 · CSS3 · JavaScript",
    work: "웹 표준화, 다수 사이트 템플릿화",
  },
  {
    year: "2024",
    company: "인터플러그",
    team: "UI/UX 개발팀",
    stack: "React → Next.js → React 19.2 · Claude Code",
    work: "반응형 개선, 컴포넌트 구조화, 관리자 시스템 구축, AI 활용 개발",
  },
] as const;

/** 성장 축. Philosophy의 4단계와 같은 축이다. */
export const GROWTH = ["MARKUP", "INTERACTION", "SYSTEM", "AI"] as const;

/**
 * AI Workflow 5단계. 원본은 Obsidian `03_AI/AI-Workflow.md`.
 * 실제로 쓰는 도구만 적는다 — 확인 전에는 추가하지 않는다.
 */
export const AI_WORKFLOW = [
  {
    no: "01",
    stage: "PLAN",
    tool: "ChatGPT",
    purpose: "기획 / 아이디어 / 요구사항",
  },
  {
    no: "02",
    stage: "ORGANIZE",
    tool: "Obsidian + Claude",
    purpose: "정보 구조화 / 문서화",
  },
  {
    no: "03",
    stage: "DESIGN",
    tool: "Google Stitch",
    purpose: "UI / UX / Visual Design",
  },
  {
    no: "04",
    stage: "BUILD",
    tool: "Claude Code",
    purpose: "Next.js / TypeScript / React",
  },
  {
    no: "05",
    stage: "REVIEW",
    tool: "Codex",
    purpose: "Code Review / Validation",
  },
] as const;

/** 검토 단계를 빼면 생산성만 오르고 완성도는 떨어진다 */
export const BUILD_PROCESS = [
  "IDEA",
  "REQUIREMENTS",
  "DETAILED PROMPT",
  "AI GENERATION",
  "CODE REVIEW",
  "VALIDATION",
  "REFACTOR",
  "SHIP",
] as const;
