import { domains, profile, skills, stack, stackGroups, tools } from '../data/profile'
import TechStackLoop from '../components/TechStackLoop'

export default function AboutPage() {
  return (
    <>
      <section className="hero">
        <div className="eyebrow">#/about</div>
        <h1>关于</h1>
        <p>
          WW — {profile.study}，求职目标 {profile.goal}。关注能跑在真实系统里的 Agent、RAG 与安全检测；
          {profile.internship}。
        </p>
      </section>

      <div className="about-grid">
        <div className="detail-body">
          <h2>简介</h2>
          <p className="lead">AI 系统构建者 —— 让 AI Agent 在浏览器里自主运行。</p>
          <p>我做一件事：让 AI 不只是聊天框里的玩具，而是能在真实系统里跑起来的工具。</p>
          <p>
            从让浏览器拥有 Agent 视觉的 Dawn，到 6 个专业 Agent 辩论决策的 Quorum，再到 69 万条流量上训练
            LightGBM 的 Phoenix IDS——我的工作始终在同一个交叉点上：系统工程的严谨性和 AI 的可能性。
          </p>
          <p>
            我相信好的 AI 产品应该像好的基础设施一样——你注意不到它，因为它一直在工作。延迟要低，输出要可靠，
            出了问题要知道去哪找原因。
          </p>
          <p className="muted">
            公开站点只留邮箱与 GitHub，不展示电话或详细地址。想直接联系：
            <a href={`mailto:${profile.email}`}> {profile.email}</a>。
          </p>

          <h2>能力域</h2>
          <ul className="highlights">
            {skills.map(s => (
              <li key={s.title}>
                <strong>{s.title}</strong> — {s.desc}
              </li>
            ))}
          </ul>
        </div>

        <div className="detail-body" id="stack">
          <h2>技术栈 #stack</h2>
          <p className="muted stack-hint">与简历技能对齐 · 锚点 #/about#stack</p>
          <TechStackLoop items={stack} label="技术栈" />

          <h2>分组明细</h2>
          <dl className="stack-groups">
            {stackGroups.map(g => (
              <div className="stack-group" key={g.label}>
                <dt>{g.label}</dt>
                <dd>{g.items.join(' · ')}</dd>
              </div>
            ))}
          </dl>

          <h2>本地 AI 工具链</h2>
          <ul className="highlights">
            {tools.map(t => (
              <li key={t.name}>
                <strong>{t.name}</strong> — {t.desc}
              </li>
            ))}
          </ul>

          <h2>关注方向</h2>
          <ul className="highlights">
            {domains.map(d => (
              <li key={d.label}>
                <strong>{d.label}</strong> — {d.desc}
              </li>
            ))}
          </ul>

          <h2>自我评价</h2>
          <p>{profile.selfEval}</p>
        </div>
      </div>
    </>
  )
}
