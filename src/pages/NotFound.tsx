interface Props {
  /** 路由兜底时传路径；项目详情页找不到时传自定义文案 */
  path?: string
  message?: string
}

export default function NotFoundPage({ path, message }: Props) {
  return (
    <div className="center-page">
      <div className="boot-card">
        <h1>404</h1>
        <p>{message ?? <>路由 <code>{path}</code> 无效</>}</p>
        <div className="cta-row" style={{ justifyContent: 'center' }}>
          <a className="btn btn-primary" href="#/">
            回首页
          </a>
          <a className="btn" href="#/projects">
            项目列表
          </a>
        </div>
      </div>
    </div>
  )
}
