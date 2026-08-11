/**
 * 원본은 Obsidian `portfolio-kcs/01_Projects/*.md`의 frontmatter다.
 * 여기 타입과 어긋나면 Obsidian이 이긴다.
 */

/** 접근 상태. 공개할 수 없는 프로젝트를 Live처럼 보이게 하지 않는다. */
export type Visibility = "case-study" | "restricted" | "development";

export type Project = {
  id: string;
  title: string;
  company: string;
  /** "YYYY-MM ~ YYYY-MM". 확인 전이면 빈 문자열 — 화면에서 렌더하지 않는다 */
  period: string;
  visibility: Visibility;
  /** 시간순이 아니라 현재 역량 → 과거 성장 과정 */
  order: number;
  tech: readonly string[];
  /** `/work` 카드 한 줄. 원본은 portfolio-자기소개 §4 */
  summary: string;
};

/** 배지 표기. 확인되지 않은 상태를 지어내지 않는다. */
export const VISIBILITY_BADGE: Record<Visibility, string | null> = {
  restricted: "🔒 RESTRICTED",
  development: "◐ DEVELOPMENT",
  // 접근 가능 여부가 아직 확인되지 않았다 — 배지를 붙이지 않는다
  "case-study": null,
};
