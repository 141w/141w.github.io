import { projects } from '../data/projects'
import ProjectCard from '../components/ProjectCard'
import { useScrollStack } from '../hooks/useScrollStack'

export default function ProjectsPage() {
  useScrollStack('/projects')

  return (
    <>
      <section className="hero">
        <div className="eyebrow">#/projects</div>
        <h1>项目列表</h1>
        <p className="muted">AI、系统和基础设施交叉领域的开源项目。</p>
        <p>
          共 {projects.length} 个项目（数字口径 wiki 2026-09）。向下滚动，卡片会依次钉在视口上方叠成一摞，
          越靠前的缩得越小；点「查看详情」进单页。
        </p>
      </section>

      <div className="ss-stack" data-ss-stack>
        <div className="ss-inner">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i + 1} total={projects.length} />
          ))}
          <div className="ss-end" aria-hidden="true" />
        </div>
      </div>
    </>
  )
}
