#!/usr/bin/env bash
# 一键部署个人站：构建 -> 同步到自建服务器；推送到 GitHub 则 Pages 自动部署。
#
#   ./scripts/deploy.sh              # 构建 + 同步到服务器
#   ./scripts/deploy.sh --push       # 构建 + 同步服务器 + git push（触发 GitHub Pages）
#   ./scripts/deploy.sh --server-only # 只同步已有 dist，不重新构建
#   ./scripts/deploy.sh --dry-run    # 仅打印将要同步的目标，不执行 rsync
#
# 服务器地址放在 .deploy.env（已被 .gitignore 忽略，不进公开仓库）。
# 建议 WEB_REMOTE 使用非 root 账号（如 deploy@host）。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SERVER_ENV="$ROOT/.deploy.env"
[ -f "$SERVER_ENV" ] || { echo "缺少 ${SERVER_ENV}，请先复制 .deploy.env.example 并填写"; exit 1; }
# shellcheck disable=SC1090
source "$SERVER_ENV"
: "${WEB_REMOTE:?未设置 WEB_REMOTE，如 deploy@your-host}"
: "${WEB_DIR:?未设置 WEB_DIR，如 /var/www/ww}"

PUSH=0
BUILD=1
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --push) PUSH=1 ;;
    --server-only) BUILD=0 ;;
    --dry-run) DRY_RUN=1 ;;
    *) echo "未知参数: $arg"; exit 1 ;;
  esac
done

# 非 root 提示（不强制失败，避免打断已有配置）
if [[ "$WEB_REMOTE" == root@* ]]; then
  echo "警告: WEB_REMOTE 使用 root（${WEB_REMOTE}）。建议改用非特权部署账号（见 .deploy.env.example）。"
fi

if [ "$BUILD" = 1 ]; then
  echo "==> 构建"
  npm run build
fi
[ -d dist ] || { echo "dist 不存在，无法同步"; exit 1; }

echo "==> 即将同步"
echo "    远端: $WEB_REMOTE"
echo "    目录: $WEB_DIR"
echo "    来源: $ROOT/dist/"
if [ "$DRY_RUN" = 1 ]; then
  echo "==> dry-run：跳过 rsync / 远端自检 / git push"
  echo "    提示: 去掉 --dry-run 才会真正同步。想看差异可自己跑："
  echo "      rsync -azn --delete --exclude 'study/' --exclude 'stats.json' dist/ \"$WEB_REMOTE:$WEB_DIR/\""
  exit 0
fi

printf "确认同步并覆盖远端文件？[y/N] "
read -r confirm
case "$confirm" in
  y|Y|yes|YES) ;;
  *) echo "已取消"; exit 1 ;;
esac

echo "==> 同步到 $WEB_REMOTE:$WEB_DIR"
# --delete 会删掉远端多余文件，所以先把不属于构建产物的东西排掉：
#   study/       同一 web root 下如果放着 Study Copilot 应用，不能被这次同步带走
#   stats.json   服务器定时任务生成的访问人次，仓库里没有，别被 --delete 删了
# 远端布局若与此不同，可在 .deploy.env 里用 RSYNC_EXCLUDE 覆盖（空格分隔）。
EXCLUDE_PATTERN="${RSYNC_EXCLUDE:-study/ stats.json}"
EXCLUDE_ARGS=()
for pattern in $EXCLUDE_PATTERN; do EXCLUDE_ARGS+=(--exclude "$pattern"); done
echo "    排除: ${EXCLUDE_PATTERN}"
rsync -az --delete "${EXCLUDE_ARGS[@]}" dist/ "$WEB_REMOTE:$WEB_DIR/"

echo "==> 远端自检"
ssh "$WEB_REMOTE" "code=\$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/); \
  js=\$(find '$WEB_DIR'/assets -name '*.js' | head -1); \
  jsc=\$(curl -s -o /dev/null -w '%{http_code}' \"http://127.0.0.1\${js#$WEB_DIR}\"); \
  n=\$(find '$WEB_DIR' -type f | wc -l); \
  echo \"  首页 HTTP \$code | 主 JS HTTP \$jsc | 文件 \$n 个\"; \
  [ \"\$code\" = 200 ] && [ \"\$jsc\" = 200 ] || exit 1"

if [ "$PUSH" = 1 ]; then
  echo "==> git push origin main（GitHub Actions 会自动构建并发布 Pages）"
  git push origin main
fi

echo "完成：自建服务器 http://${WEB_SITE_URL:-<在 .deploy.env 里配 WEB_SITE_URL>} 与 https://141w.github.io"
