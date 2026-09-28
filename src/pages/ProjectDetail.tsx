import { findProject } from '../data/projects'
import Tags from '../components/Tags'
import LikeButton from '../components/LikeButton'
import TechStackLoop from '../components/TechStackLoop'
import NotFoundPage from './NotFound'

interface Props {
  id: string
}

export default function ProjectDetailPage({ id }: Props) {
  const p = findProject(id)
  if (!p) return <NotFoundPage message={`未找到项目「${id}」`} />

  return (
    <>
      <div className="breadcrumb">
        <a href="#/projects">项目</a> / <span>{p.title}</span>
      </div>

      <section className="hero hero-slim">
        <div className="card-head">
          <h1>
            {p.title}
            {p.featured && <span className="badge">FEATURED</span>}
          </h1>
          <LikeButton id={p.id} name={p.title} size={26} />
        </div>
        <p className="hero-tagline">{p.tagline}</p>
        <p className="muted">
          {p.year} · {p.period} · {p.status} · {p.role}
        </p>
      </section>

      <section className="section">
        <div className="detail-body">
          <h2>项目说明</h2>
          <p>{p.description}</p>
          <p className="conclusion">→ {p.conclusion}</p>

          <h2>要点</h2>
          <ul className="highlights">
            {p.highlights.map(h => (
              <li key={h}>{h}</li>
            ))}
          </ul>

          <h2>技术栈</h2>
          <TechStackLoop items={p.stack} label={`${p.title} 技术栈`} />

          <h2>标签</h2>
          <Tags tags={p.tags} />
        </div>

        <div className="meta-grid">
          <dl>
            <dt>周期</dt>
            <dd>{p.period}</dd>
            <dt>状态</dt>
            <dd>{p.status}</dd>
            <dt>角色</dt>
            <dd>{p.role}</dd>
            <dt>代码</dt>
            <dd>
              {p.links.github ? (
                <a href={p.links.github} target="_blank" rel="noopener noreferrer">
                  {p.links.github.replace(/^https?:\/\//, '')}
                </a>
              ) : (
                <span className="muted">暂未开源</span>
              )}
            </dd>
            {p.links.demo && (
              <>
                <dt>在线</dt>
                <dd>
                  <a href={p.links.demo} target="_blank" rel="noopener noreferrer">
                    {p.links.demo.replace(/^https?:\/\//, '')}
                  </a>
                </dd>
              </>
            )}
          </dl>
        </div>

        <div className="actions">
          {p.links.demo && (
            <a className="btn btn-primary" href={p.links.demo} target="_blank" rel="noopener noreferrer">
              前往使用
            </a>
          )}
          <a className="btn" href="#/projects">
            ← 返回列表
          </a>
          <a className="btn btn-primary" href="#/contact">
            联系
          </a>
        </div>
      </section>
    </>
  )
}
