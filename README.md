# AI-Native Portfolio

个人 AI-Native 风格作品集网站。

## 技术栈

React 19 + Vite + TypeScript + TailwindCSS + Motion + Three.js + Lucide React

## 开发

```bash
npm run dev
```

## 构建

```bash
npm run build
```

## 推送

```bash
.\gitpush.ps1 "提交信息"
```

或手动：

```bash
git add -A
git commit -m "提交信息"
git push
```

## 部署

站点同时跑在两个地方：

- **GitHub Pages**：<https://141w.github.io> —— `push` 到 `main` 后由 Actions 自动构建发布（`.github/workflows/deploy.yml`）。
- **自建服务器**：<http://wweiqi.devs.surf>（devs.surf 免费域名，A 记录指向服务器）—— nginx 托管静态文件，需要手动同步。

一条命令同时更新两处：

```bash
./scripts/deploy.sh --push   # 构建 + 同步服务器 + 推送触发 Pages
./scripts/deploy.sh          # 只构建并同步服务器
./scripts/deploy.sh --server-only  # 不重新构建，只把现有 dist 推上去
```

首次使用：`cp .deploy.env.example .deploy.env` 并填入服务器地址（该文件已被 gitignore，不会进仓库）。脚本末尾会自动做远端自检，首页和主 JS 都返回 200 才算成功。

注意 `vite.config.ts` 里 `base` 必须是 `'/'`：两处托管都在根路径，改成子路径会导致资源 404、整站白屏。

## 远端仓库

```
origin  git@github.com:141w/141w.github.io.git (push)
分支: main
```

## 项目位置

```
~/Desktop/update plan/ww
```
