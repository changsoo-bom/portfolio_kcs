/**
 * 사이트에 노출되는 원고. 문구를 고칠 때 컴포넌트를 열지 않게 여기 모아둔다.
 * 확정 원고는 Obsidian `portfolio-kcs/portfolio-자기소개.md`에서 옮겨온다.
 */
export const PROFILE = {
  name: "김창수",
  role: "프론트엔드 개발자",
  // TODO: 한 줄 소개 확정 (portfolio-자기소개 §1) — 아래는 자리표시 문구다
  tagline: "웹 프론트엔드 개발자. Next.js와 TypeScript로 화면을 만듭니다.",
  // TODO: 개인 메일로 교체. 회사 메일은 이직하면 그대로 죽는다
  email: "kcs@example.com",
  github: "https://github.com/changsoo-bom",
} as const;

export const NAV_ITEMS = [
  { no: "01", label: "ABOUT", href: "/about" },
  { no: "02", label: "SKILLS", href: "/skills" },
  { no: "03", label: "WORK", href: "/work" },
  { no: "04", label: "CONTACT", href: "/contact" },
] as const;
