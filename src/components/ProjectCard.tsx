import type { Project } from '../data/projects'
import Tags from './Tags'
import LikeButton from './LikeButton'

interface ProjectCardProps {
  project: Project
  /** 从 1 开始，卡片右上角显示 01/06 这种序号 */
  index: number
  total: number
}

/** /projects 堆叠卡片的卡面。滚动钉位由 ScrollStack 负责，这里只管内容。 */
export default function ProjectCard({ project, index, total }: ProjectCardProps) {
  return (
    <article className="ss-card" data-ss-card>
      <span className="ss-no" aria-hidden="true">
        {String(index).padStart(2, '0')}/{String(total).padStart(2, '0')}
      </span>

      <div className="card-head">
        <a className="title" href={`#/projects/${project.id}`}>
          {project.title}
          {project.featured && <span className="badge">FEATURED</span>}
        </a>
        <LikeButton id={project.id} name={project.title} likes={project.likes} />
      </div>

      <p className="ss-meta">
        {project.period} · {project.status} · {project.role}
      </p>
      <p className="ss-tagline">{project.tagline}</p>
      <p className="ss-summary">{project.description}</p>

      <Tags tags={project.tags} limit={3} />

      <div className="actions">
        {project.links.demo && (
          <a className="btn btn-primary" href={project.links.demo} target="_blank" rel="noopener noreferrer">
            前往使用
          </a>
        )}
        <a className={`btn ${project.links.demo ? '' : 'btn-primary'}`} href={`#/projects/${project.id}`}>
          查看详情
        </a>
        {project.links.github && (
          <a className="btn" href={project.links.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        )}
      </div>
    </article>
  )
}
