import { SectionHead } from "@/components/common/SectionHead";
import { ProjectCard } from "@/components/project/card/ProjectCard";
import { PROJECTS } from "@/constants/projects";

export function WorkSection() {
  // 시간순이 아니다. order가 곧 표시 순서다 (Sitemap §프로젝트 표시 순서)
  const projects = [...PROJECTS].sort((a, b) => a.order - b.order);

  return (
    <section id="work" className="scroll-mt-24 pt-32 pb-24 md:pt-40">
      <SectionHead
        no="03"
        label="Work"
        title="프로젝트"
        lead="시간순이 아니라 현재 역량에서 과거 성장 과정 순으로 놓았습니다."
      />

      <div className="pt-8">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>

      <p className="reveal mt-10 font-mono text-sm leading-[1.7] text-label">
        🔒 RESTRICTED — VPN·사내 환경 등 접근 제한
        <br />◐ DEVELOPMENT — 실제 적용 전
      </p>
    </section>
  );
}
