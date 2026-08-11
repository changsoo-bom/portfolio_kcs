import type { Metadata } from "next";

import { PageHeader } from "@/components/common/PageHeader";
import { ProjectCard } from "@/components/project/card/ProjectCard";
import { PROJECTS } from "@/constants/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "프론트엔드 프로젝트 5개 — 현재 역량에서 과거 성장 과정 순.",
};

export default function WorkPage() {
  // 시간순이 아니다. order가 곧 표시 순서다 (Sitemap §프로젝트 표시 순서)
  const projects = [...PROJECTS].sort((a, b) => a.order - b.order);

  return (
    <>
      <PageHeader
        no="03"
        label="Projects"
        title="프로젝트"
        lead="시간순이 아니라 현재 역량에서 과거 성장 과정 순으로 놓았습니다."
      />

      <div>
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>

      <p className="mt-10 font-mono text-sm leading-[1.6] text-label">
        🔒 RESTRICTED — VPN·사내 환경 등 접근 제한
        <br />◐ DEVELOPMENT — 실제 적용 전
      </p>
    </>
  );
}
