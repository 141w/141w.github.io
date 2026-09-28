export interface ProjectLinks {
  github?: string
  /** 可直接体验的线上入口（自建服务器） */
  demo?: string
}

export interface Project {
  id: string
  title: string
  tagline: string
  /** 卡片与详情页共用的摘要，口径来自 wwq_wiki/projects/*.md（2026-09） */
  description: string
  conclusion: string
  tags: string[]
  highlights: string[]
  /** 卡片技术栈跑马灯用的完整条目，比 tags 细 */
  stack: string[]
  links: ProjectLinks
  featured?: boolean
  year: string
  period: string
  status: string
  role: string
  /** 终端/搜索别名，例如 mindos -> my-wiki */
  aliases?: string[]
}

export const projects: Project[] = [
  {
    id: 'dawn',
    title: 'Dawn',
    tagline: '带 AI Agent 的桌面浏览器 · Zen UI + 真实系统内操作',
    description:
      'Electron 36 + React 19 的个性化 AI 浏览器：复刻 Zen 布局，内置 18 个浏览器工具，让 Agent 在真实页面上导航、点击、填表与滚动，完成多步任务。',
    conclusion: '让 AI Agent 拥有眼睛和双手——在真实浏览器中自主完成复杂任务链',
    tags: ['Electron', 'React 19', 'Browser Agent', 'Zen UI'],
    highlights: [
      '2026-09 完成 Vue 3 → React 19 前端迁移：原 src/ composables 整体重写为 src-react/ 的 21 个 hooks + 28 个 tsx 组件',
      'Zen 框架复刻 P0→P6 全量落地：单工具栏 + 垂直标签条、Workspaces（Alt+1..9）、Compact 紧凑与 Glance 预览、标签文件夹二级分组与富右键菜单',
      '18 个浏览器工具统一注册（导航 / DOM / 截图 / 点击填表 / 下拉 / 等待元素 / 执行脚本 / 下载 / 子任务委托）',
      '跨对话记忆引擎（better-sqlite3）：主动注入 system prompt、短期→长期自动提升、相关性与时间衰减排序、每日笔记；另有对话压缩与模型故障转移链',
      '多 Provider 接入：OpenAI / Anthropic / DeepSeek / Google / 通义 / 智谱 / Moonshot / Ollama / LM Studio 与自定义兼容端点',
      '生产级加固：electron-updater 自动更新 + NSIS、单实例锁、崩溃恢复、CSP 安全头；136 个 Vitest 用例（含 Zen 交互断言）',
      '外延能力：Firefox Zen 侧栏扩展（dawn-ai.xpi）、MCP 协议、技能系统与插件 SDK、语音输入输出、文档查看器（Mermaid / pdfjs / mammoth / xlsx）',
    ],
    stack: ['Electron 36', 'React 19', 'TypeScript', 'Vite 6', 'better-sqlite3', 'MCP', 'electron-updater', 'Vitest'],
    links: { github: 'https://github.com/141w/Dawn-Browser' },
    year: '2026',
    period: '2026/01 - 至今',
    status: '进行中',
    role: '独立开发 / AI 全栈',
  },
  {
    id: 'quorum',
    title: 'Quorum',
    tagline: 'Hermes 系桌面 AI 助手 · 多 Agent 辩论与蜂群',
    description:
      '基于 Hermes Agent 的可移植桌面助手：数据落在项目本地 .quorum/，支持 6 Agent 辩论式决策与蜂群并行，技能与工具链可随项目迁移。',
    conclusion: '数据存在项目本地 .quorum/，零外部依赖，随项目一起迁移',
    tags: ['Multi-Agent', 'Hermes', 'Electron', 'FastAPI'],
    highlights: [
      '状态机驱动工作流：6 个专业 Agent 辩论式决策，支持投票 / 阈值 / 辩论三种决策模式',
      '蜂群系统：多工蜂并行处理大型任务（coding / research / review），Python 实现、自动重试',
      '品牌重塑：hermes_* → quorum_*（后端 18 个文件 + SOUL.md + prompt_builder），HERMES_HOME → QUORUM_HOME，旧自定义后端全部迁入 Hermes 原生后端',
      '技能体系：.quorum/skills/ 下 20 个分类目录 + quorum-swarm / quorum-worker 自有技能；配合 ChromaDB 向量记忆与 Docker 沙箱隔离',
      '本地化：简中 / 繁中 / 英文 / 日文四语言界面',
      '一键启动 ./start-desktop.sh（后端 :8080 + Vite :5174 + Electron 36 桌面壳）',
    ],
    stack: ['Python 3.13', 'FastAPI', 'SQLite', 'React 19', 'Electron 36', 'ChromaDB', 'Docker', 'Tailwind'],
    links: { github: 'https://github.com/141w/Quorum' },
    year: '2026',
    period: '2026/04 - 至今',
    status: '进行中 · 功能迭代',
    role: '独立开发 / AI 全栈',
  },
  {
    id: 'phoenix-ids',
    title: 'Phoenix IDS',
    tagline: '多源融合入侵检测 · 特征选择与稳定性研究',
    description:
      '基于机器学习的网络入侵检测：UNSW-NB15 + CICIDS2017 融合 695,263 条样本，双重特征选择 + 折内 SMOTE，主推 LightGBM，覆盖 10 类攻击；论文《多源数据融合下梯度提升入侵检测模型的特征选择与稳定性研究》。',
    conclusion: 'SMOTE + LightGBM F1-Macro 0.7279±0.0031，较基线提升 21.6%',
    tags: ['IDS', 'LightGBM', 'SMOTE', 'SHAP'],
    highlights: [
      '9 组对比实验 + 5 折分层交叉验证，SMOTE 严格折内应用防数据泄露',
      '双重特征选择（互信息 + LightGBM 重要性）：191 维 → 30 维',
      'F1-Macro 0.7279 ± 0.0031，较 v2（82,332 条 / 80 维）提升 21.6%；标准差 0.0132 → 0.0031，稳定性提升 76.5%',
      'SMOTE 使少数类 Recall 0.3234 → 0.4401（+36.1%），配对 t 检验显著优于无 SMOTE（p=0.014）',
      '代价感知 SMOTE：Worms / Shellcode / Backdoor 等高危攻击 Recall 再提升 10~14%',
      '稳健性验证：折内特征选择 F1-Macro 0.7241±0.0035，与全量选择无显著差异（p=0.12）',
      'SHAP 归因：协议类型特征（proto_*）对决策贡献最大；单条 Top-5 + 全局 Top-20',
      '工程侧：6 种算法一键对比、置信度四级分级、异常行为分析（端口 / 协议 / 时间热力图 / Z-score）、白名单与基线规则、高危告警 Webhook、feedback.jsonl 反馈闭环',
      '答辩材料：12+ 张 Nature 风格图表（PDF/SVG/TIFF）、presentation_v3、问答准备 6 大类 14 问',
    ],
    stack: [
      'Python',
      'LightGBM',
      'XGBoost',
      'SMOTE',
      'SHAP',
      'FastAPI',
      'Vue 3',
      'Element Plus',
      'ECharts',
      'Scapy',
      'Docker',
    ],
    links: { github: 'https://github.com/141w/Phoenix-IDS' },
    year: '2025–2026',
    period: '2025/09 - 2026/01',
    status: '已完成 · 论文 paper_v5',
    role: '独立开发 / 安全 · ML',
    aliases: ['phoenix', 'ids'],
  },
  {
    id: 'study-copilot',
    title: 'Study Copilot',
    tagline: 'Agentic RAG + 深度研究 Agent 的本地学习助手',
    description:
      '本地优先、可自托管的 AI 学习助手：上传文档 → Agentic RAG 带引用问答 → 深度研究 Agent → 出题与错题闭环；定位已从早期 FAISS 问答演进为 Agentic RAG，向量检索主路径迁到 PostgreSQL pgvector。',
    conclusion: '719 个后端测试 + 检索评测门禁，recall@10 下降 >2pt 即 CI 失败',
    tags: ['Agentic RAG', 'pgvector', 'FastAPI', 'Vue 3'],
    highlights: [
      'Agentic RAG 问答：意图路由 · 自适应检索 · 纠错重试 · 答案自我反思 · 来源卡片与正文 [来源N] 联动高亮',
      '深度研究 Agent：ReAct 循环 + 6 只读工具，多层熔断（迭代 / Token 预算 / 重复调用 / 新颖度）',
      '混合检索：pgvector 语义 + 全文检索 + RRF 融合（单条 SQL）+ 自适应分块链；流式思考透明化（SSE 逐 token · 原生 CoT · 三层折叠面板）',
      '学习闭环：自动出题 · 错题本 · 学情分析 · 课程空间 · 多角色研讨；长期记忆五分类（画像/偏好/事实/任务/兴趣）+ pending 确认隔离 + CJK 词法召回',
      '可复现检索评测（Recall@k / MRR@k / nDCG@k，C-MSMARCO / CMedQA / FinanceQA，6 种方法横评）驱动的真实结论：中文全文未配 zhparser 会让 hybrid 顶部召回塌方（R@1 0.035 vs bm25 0.655）；英文 reranker 全线负增益故默认关闭；SemanticChunker 对连贯文档退化为单巨块（40 页 → 1 个 46K 字块），修复后 66 块；纠错检索触发率 0% 且触发即有害，默认关闭',
      '工程质量：后端 66 个测试文件 / 719 用例（覆盖率门禁 ≥65%）+ 前端约 298 用例；mypy 渐进棘轮、ruff、ESLint、X-Trace-ID 全链路追踪',
      '第三方归属：classroom/ 模块整体 vendored 自 THU-MAIC/OpenMAIC，自研仅为集成层；Agentic 架构（洋葱管线 / ReAct / 长期记忆 / 自适应分块）参考 TencentCloudADP/WeKnora，本仓库以 Python 重写',
    ],
    stack: [
      'Python',
      'FastAPI',
      'SQLAlchemy async',
      'Alembic',
      'PostgreSQL 16',
      'pgvector',
      'Vue 3',
      'Pinia',
      'Docling',
      'pytest',
      'Docker',
    ],
    links: {
      github: 'https://github.com/141w/Study-copilot',
      demo: 'https://wweiqi.devs.surf/study/',
    },
    featured: true,
    year: '2025–2026',
    period: '2025/03 - 至今',
    status: '进行中 · 检索质量攻坚',
    role: '全栈 / AI 应用',
    aliases: ['study', 'copilot'],
  },
  {
    id: 'mindflow-ai',
    title: 'MindFlow AI',
    tagline: '微信小程序随身学习伙伴 · wiki 同源数据',
    description:
      '把 PDF、课程与笔记变成可对话、可复习的随身知识系统：资料理解 + 对话体验 + 知识管理 + 复习机制。9 个页面；知识数据由本地 wiki 解析生成，与 MindOS / llm-wiki 体系同源。',
    conclusion: '知识数据由本地 wiki 解析生成，与知识库体系同源',
    tags: ['微信小程序', 'TypeScript', '知识库'],
    highlights: [
      '9 页架构：home（今日目标 / 进度 / 连续天数）、library（分类 + 搜索 + 掌握度追踪）、chat（AI 导师 + 引用卡片 + 总结/笔记/出题快捷操作）、detail、plan、review、graph（知识图谱可视化）、profile（学习画像与 AI 评价）、settings',
      '知识数据 wiki-data.ts 共 934 行 / 约 112KB，由本地知识库 wwq_wiki 解析生成，与 MindOS 同源，不额外维护一份内容',
      'AI 导师走 OpenAI 兼容 API（wx.request），支持流式对话与引用卡片；端点与模型在 settings 内可换',
      '设计语言：深色沉浸 + 按钮统一 9999rpx 药丸形',
    ],
    stack: ['微信小程序', 'TypeScript', 'OpenAI-compatible API'],
    links: {},
    year: '2026',
    period: '2026',
    status: '个人项目 · 本地代号 MindOS-Q',
    role: '独立开发 / 小程序',
    aliases: ['mindflow'],
  },
  {
    id: 'my-wiki',
    title: 'MindOS',
    tagline: '个人知识操作系统 · Obsidian 插件 + Web:3721',
    description:
      '围绕本地 Markdown Wiki 的个人知识操作系统（仓库 My_wiki / MindOS）：不是单纯 RAG 壳，而是让 LLM 持续维护会成长的知识库——来源整理、实体沉淀、主题综合、交叉引用、矛盾标记、项目记忆与周期反思。',
    conclusion: 'Obsidian 插件 + 本地 Web 服务双入口，七大引擎完整闭环',
    tags: ['Wiki', 'Obsidian', '七引擎', 'LLM'],
    highlights: [
      '双入口：mindos-plugin/ 在 Obsidian 内直接读写 wiki 并调用 AI 助手；mindos-plugin/web/ 是本地 Web 服务 + SPA（端口 3721），负责知识管理、任务、AI 对话与报告',
      '七大引擎：Wiki / Ingest / Query / Project / Memory / Reflection / CrossReference，覆盖从资料入库到周期反思的完整闭环',
      '配置分两层：仓库模板 .mindos/config.yml 与实际知识库 .mindos/config.yml；API key 只存插件设置不入库；管理的知识库就是本仓库解析出的 wwq_wiki',
      'LLM Providers：OpenAI / Anthropic / Ollama / 自定义兼容端点',
      '质量保障：插件侧 16 个 vitest 测试文件；Web 侧单元 + 集成测试覆盖 CORS、路径穿越、限流、缓存、分页与中文 URL 解码',
      '当前在做：把 4328 行单体前端 app.js 按 Phase A-D（稳定性 / 模块化 / 可测试性与构建 / 设计系统）拆开，坚持 vanilla JS，不引入 React/Vue',
    ],
    stack: ['TypeScript', 'Obsidian Plugin', 'Vanilla Web', 'LLM Providers'],
    links: {},
    year: '2026',
    period: '2026',
    status: '进行中 · 重构计划 Phase A-D',
    role: '独立开发 / 知识工程',
    aliases: ['mindos', 'wiki'],
  },
]

export function findProject(id: string): Project | undefined {
  const key = id.toLowerCase()
  return projects.find(
    p => p.id === key || (p.aliases?.map(a => a.toLowerCase()).includes(key) ?? false)
  )
}

export const featuredProject: Project = projects.find(p => p.featured) ?? projects[0]
