import { featuredProject } from '../data/projects'
import { motto, skills } from '../data/profile'
import Tags from '../components/Tags'
import LikeButton from '../components/LikeButton'
import TechTitle from '../components/TechTitle'

export default function HomePage() {
  const f = featuredProject

  return (
    <>
      <section className="hero hero-bare">
        <TechTitle text={motto.compact} srLabel={motto.srLabel} size={168} />
        <div className="cta-row">
          <a className="btn btn-primary" href="#/projects">
            浏览项目
          </a>
          <a className="btn" href="#/contact">
            取得联系
          </a>
        </div>
      </section>

      <section className="section">
        <h2>// 精选项目</h2>
        <article className="featured">
          <div className="card-head">
            <h3>
              <a href={`#/projects/${f.id}`}>
                {f.title}
                <span className="badge">FEATURED</span>
              </a>
            </h3>
            <LikeButton id={f.id} name={f.title} likes={f.likes} size={26} />
          </div>

          <p className="featured-tagline">{f.tagline}</p>
          <p>{f.description}</p>
          <p className="conclusion">→ {f.conclusion}</p>

          <Tags tags={f.tags} limit={3} />

          <div className="actions">
            {f.links.demo && (
              <a className="btn btn-primary" href={f.links.demo} target="_blank" rel="noopener noreferrer">
                前往使用
              </a>
            )}
            <a className={`btn ${f.links.demo ? '' : 'btn-primary'}`} href={`#/projects/${f.id}`}>
              查看详情
            </a>
            {f.links.github && (
              <a className="btn" href={f.links.github} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            )}
          </div>
        </article>
      </section>

      <section className="section">
        <h2>// 能力速览</h2>
        <div className="skills">
          {skills.map(s => (
            <div className="skill" key={s.title}>
              <strong>{s.title}</strong>
              <span>{s.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>// 下一步</h2>
        <p className="muted">想看完整项目列表，或直接邮件沟通？</p>
        <div className="cta-row">
          <a className="btn btn-primary" href="#/projects">
            项目列表
          </a>
          <a className="btn" href="#/contact">
            联系
          </a>
          <a className="btn" href="#/about#stack">
            技术栈
          </a>
        </div>
      </section>
    </>
  )
}
