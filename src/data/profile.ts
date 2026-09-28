/**
 * 站点文案数据，口径来自 ~/Desktop/wwq_wiki（entities/user-wwq.md、projects/*.md，2026-09）。
 * 隐私规则：公开站不写电话、不写精确地址，联系只留邮箱与 GitHub；
 * 教育经历已撤下，实习只写「软件实施」，不写公司全名。
 */
export const profile = {
  goal: 'AI 全栈开发实习生',
  study: '2023 级 · 计算机科学与技术 · 本科（在读）',
  internship: '2026/08 起实习，岗位为软件实施（企业服务交付方向）',
  selfEval:
    '自学能力较强，遇到新技术能快速上手并应用到实际项目中；在校期间独立完成多个从零到一的项目，对后端开发与 AI 应用方向有持续热情，愿意深入打磨技术细节。',
  email: 'wweiqi77@163.com',
  github: 'https://github.com/141w',
} as const

export interface Skill {
  title: string
  desc: string
}

/** 能力速览（首页）与能力域（关于页）共用 */
export const skills: Skill[] = [
  {
    title: '编程与全栈',
    desc: 'Python · React + TypeScript / Vue 3 · FastAPI · 完整前后端分离项目经验',
  },
  {
    title: 'AI 与大模型',
    desc: 'RAG 各环节（向量检索 / 重排序 / Prompt 工程）· 多 LLM 接口集成 · LangChain / LangGraph Agent 工作流 · 状态机编排与工具调用',
  },
  {
    title: '机器学习',
    desc: '模型训练与评估 · 特征选择 · SMOTE 过采样 · SHAP 可解释性 · 了解模型蒸馏与 QLoRA 微调流程',
  },
  {
    title: '桌面与浏览器 Agent',
    desc: 'Electron 36 · 18 个浏览器工具链 · Zen UI 复刻 · MCP / 技能系统 / 插件 SDK',
  },
  {
    title: '知识与检索工程',
    desc: 'pgvector 语义 + 全文 + RRF 融合 · 本地 Wiki 七引擎 · 小程序同源数据 · 检索指标评测（Recall / MRR / nDCG）',
  },
  {
    title: '工程效能',
    desc: 'Vitest / pytest 与覆盖率门禁 · mypy / ruff / ESLint · Docker · Cursor / Claude Code 等 AI 辅助开发',
  },
]

/** 关于页技术栈跑马灯条目 */
export const stack: string[] = [
  'Python',
  'TypeScript',
  'React 19',
  'Vue 3',
  'Electron 36',
  'FastAPI',
  'PostgreSQL / pgvector',
  'LightGBM',
  'LangGraph / Agent',
  'RAG / Agentic RAG',
  '微信小程序',
  'Vitest / pytest',
  'Docker',
  'Git / GitHub',
]

/** 原站点 TechStack 的四组分类明细，关于页保留 */
export const stackGroups: { label: string; items: string[] }[] = [
  { label: 'languages', items: ['Python', 'TypeScript', 'JavaScript', 'SQL', 'GLSL'] },
  { label: 'ai_ml', items: ['RAG', 'pgvector', 'FAISS', 'LightGBM', 'SHAP', 'LangGraph'] },
  { label: 'infra', items: ['Three.js', 'Docker', 'PostgreSQL', 'SQLite', 'WebSocket'] },
  { label: 'frontend', items: ['Electron', 'React 19', 'Vue 3', 'TailwindCSS', '微信小程序'] },
]

/** 原站点 tools.md 段落，关于页保留 */
export const tools: { name: string; desc: string }[] = [
  {
    name: 'Hermes Agent',
    desc: '开源 AI Agent 框架：技能系统 · 持久记忆 · 多平台网关（WeChat / Telegram）· Provider 无关',
  },
  {
    name: 'Ollama',
    desc: '本地 LLM 推理框架，OpenAI 兼容 API，Modelfile 自定义模型',
  },
  {
    name: 'llmfit',
    desc: '硬件适配终端工具：检测 M4 16GB 统一内存，估算 tok/s 并推荐量化格式',
  },
  {
    name: 'conda / Docker / Homebrew',
    desc: '项目级虚拟环境与容器化交付 · ripgrep 全库检索',
  },
]

/** 原站点 domains 清单，关于页保留 */
export const domains: { label: string; desc: string }[] = [
  { label: 'AI Agents', desc: '自主推理、工具使用与多 Agent 编排' },
  { label: 'AI 基础设施', desc: 'RAG 管道、pgvector 检索与 LLM 部署' },
  { label: '浏览器运行时', desc: 'Electron 桌面应用、Web 自动化与 Agent 浏览' },
  { label: '安全 AI', desc: '威胁检测、异常评分与入侵防御' },
  { label: '全栈工程', desc: '从 Electron 主进程到 React 组件' },
  { label: '知识管理', desc: 'LLM 持续维护的个人知识操作系统' },
]

/** Hero 字标（TechText canvas 渲染，sr-only 提供真实文本） */
export const motto = {
  /** canvas 画这串：不带空格，四个字才撑得住大字号（字越少画得越大） */
  compact: '跑·验·复·恒',
  /** 开屏卡片与 sr-only 用带间隔的版本 */
  chars: '跑 · 验 · 复 · 恒',
  srLabel: '跑 · 验 · 复 · 恒：能跑通、可核验、可复现、能长期维护',
  gloss: ['跑 能跑通，不是演示', '验 指标与测试说话', '复 可复现，归属写清', '恒 长期维护，会成长'],
} as const
