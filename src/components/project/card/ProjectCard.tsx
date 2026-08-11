import type { Project } from "@/types/project";
import { VISIBILITY_BADGE } from "@/types/project";

/**
 * `/work` 목록의 한 항목.
 *
 * 상세 페이지(`/work/[id]`)는 아직 만들지 않는다 — Overview·Challenge·Approach가
 * 채워진 프로젝트가 3개 이상일 때 만든다 (portfolio-기획 §라우트 구조).
 * 그래서 링크가 아니라 `<article>`이다.
 */
export function ProjectCard({ project }: { project: Project }) {
  const badge = VISIBILITY_BADGE[project.visibility];

  return (
    <article className="grid grid-cols-1 gap-6 py-10 border-b border-hairline md:grid-cols-12">
      <div className="md:col-span-3">
        <p className="label">{String(project.order).padStart(2, "0")}</p>
        {project.period ? (
          <p className="mt-2 font-mono text-sm text-label">{project.period}</p>
        ) : null}
      </div>

      <div className="md:col-span-9">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h2 className="text-2xl font-medium tracking-[-0.01em] text-ink">
            {project.title}
          </h2>
          <span className="font-mono text-sm text-label">
            {project.company}
          </span>
          {badge ? (
            <span className="px-2 py-1 font-mono text-xs tracking-wider text-ink border border-hairline rounded-sm">
              {badge}
            </span>
          ) : null}
        </div>

        <p className="mt-4 max-w-[600px] text-[15px] leading-[1.6] text-muted">
          {project.summary}
        </p>

        <ul className="flex flex-wrap gap-2 mt-6">
          {project.tech.map((t) => (
            <li
              key={t}
              className="px-3 py-1 font-mono text-xs tracking-wider text-label border border-hairline rounded-sm"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
