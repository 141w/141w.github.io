import { profile } from '../data/profile'

export default function ContactPage() {
  return (
    <>
      <section className="hero">
        <div className="eyebrow">#/contact</div>
        <h1>联系</h1>
        <p>
          岗位合作、项目复盘或技术讨论，都欢迎直接来信。无论是项目合作、技术咨询还是开源贡献，都可以聊聊。
        </p>
      </section>

      <section className="section">
        <div className="contact-box">
          <h2>渠道</h2>
          <dl>
            <dt>邮箱</dt>
            <dd>
              <a href={`mailto:${profile.email}?subject=${encodeURIComponent('合作咨询')}`}>{profile.email}</a>
            </dd>
            <dt>GitHub</dt>
            <dd>
              <a href={profile.github} target="_blank" rel="noopener noreferrer">
                github.com/141w
              </a>
            </dd>
          </dl>
          <p className="muted">
            公开页不写电话与详细地址；需要进一步沟通请在邮件里说明，我再补充。
          </p>
          <div className="actions">
            <a className="btn btn-primary" href={`mailto:${profile.email}?subject=${encodeURIComponent('合作咨询')}`}>
              写邮件
            </a>
            <a className="btn" href="#/projects">
              先看项目
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
