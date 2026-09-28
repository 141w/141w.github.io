# AI-Native Portfolio

个人 AI-Native 风格作品集网站。

## 技术栈

React 19 + Vite + TypeScript + TailwindCSS。特效是原生实现（WebGL / Canvas / WAAPI），
不依赖 Three.js、Motion 或 GSAP；`src/lib/*.js` 是从信息架构样品里迁过来的十个组件实现。

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
- **自建服务器**：<https://wweiqi.devs.surf>（devs.surf 免费域名，A 记录指向服务器）—— nginx 托管静态文件，需要手动同步。注意 80 端口被备案拦截，只有 443 可用。

一条命令同时更新两处：

```bash
./scripts/deploy.sh --push   # 构建 + 同步服务器 + 推送触发 Pages
./scripts/deploy.sh          # 只构建并同步服务器
./scripts/deploy.sh --server-only  # 不重新构建，只把现有 dist 推上去
```

首次使用：`cp .deploy.env.example .deploy.env` 并填入服务器地址（该文件已被 gitignore，不会进仓库）。脚本末尾会自动做远端自检，首页和主 JS 都返回 200 才算成功。

同步用的是 `rsync --delete`，会删掉远端多出来的文件。第一次在新机器上跑之前，先看一眼远端布局，
确认同一个 web root 下没有别的应用：

```bash
source .deploy.env
ssh "$WEB_REMOTE" "ls -la $WEB_DIR; grep -rn study /etc/nginx/conf.d/ /etc/nginx/sites-enabled/ | head"
```

脚本默认排除 `study/` 与 `stats.json`；布局不同就在 `.deploy.env` 里用 `RSYNC_EXCLUDE` 覆盖。

注意 `vite.config.ts` 里 `base` 必须是 `'/'`：两处托管都在根路径，改成子路径会导致资源 404、整站白屏。

## 访问人次（stats.json）

页脚的访问人次不是编的：由 `scripts/visit-stats.py` 从 nginx 访问日志算出
「独立访客·天」（日期 + 客户端 IP 去重），写成站点根目录的 `stats.json`；
前端读不到这个文件就整块不显示这个数字。点赞按钮同理只记录访客本地状态，不显示总数。

在服务器上给这个站单独一份带 `$host` 的日志格式（不影响其他 vhost）：

```nginx
log_format ww_main '$remote_addr - $remote_user [$time_local] "$host" '
                   '"$request" $status $body_bytes_sent "$http_user_agent"';

server {
  # ...wweiqi.devs.surf 的 server 块
  access_log /var/log/nginx/ww.access.log ww_main;

  # Pages 那条腿要跨域读这个文件
  location = /stats.json {
    add_header Access-Control-Allow-Origin "*";
    add_header Cache-Control "no-store";
  }
}
```

然后 `nginx -t && systemctl reload nginx`，再挂定时任务（每天 04:10 重算，含轮转日志与 .gz）：

```cron
10 4 * * * root python3 /var/www/ww/scripts/visit-stats.py \
  --log /var/log/nginx/ww.access.log --host wweiqi.devs.surf \
  --since 2026-09-01 --out /var/www/ww/stats.json >> /var/log/visit-stats.log 2>&1
```

先 `--dry-run` 跑一遍确认口径和条数再实际写。本地想要同样效果：`cp dist 里的 stats.json`，
或给构建加 `VITE_STATS_URL=https://wweiqi.devs.surf/stats.json`（Pages 上没有这个文件时会自动隐藏）。

## 远端仓库

```
origin  git@github.com:141w/141w.github.io.git (push)
分支: main
```

## 项目位置

```
~/Desktop/update plan/ww
```
