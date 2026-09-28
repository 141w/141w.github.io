#!/usr/bin/env python3
"""从 nginx 访问日志生成站点 stats.json（访问人次的真实来源）。

口径：独立访客·天（UV·day）——按「日期 + 客户端 IP」去重后累计计数。
只统计页面请求，因此轮询 stats.json 自身不会污染数字。

用法：
  python3 visit-stats.py --log /var/log/nginx/ww.access.log \
      --out /var/www/ww/stats.json [--since 2026-09-01] [--dry-run]

日志格式由本仓库推荐的 log_format ww_main 产生（见 README「访问人次」一节）：
  $remote_addr - $remote_user [$time_local] "$host" "$request" $status $body_bytes_sent "$http_user_agent"

设计取舍：
- 每次运行都从现存日志整体重算，不维护增量状态，所以定时任务可以随时补跑或改口径。
- 原子写入（临时文件 + rename），访客不会读到半截 JSON。
- 读不到的时候前端整块不显示数字，因此这里宁可不输出，也不要给出编造值。
"""

from __future__ import annotations

import argparse
import gzip
import json
import os
import re
import sys
import tempfile
from datetime import datetime, timezone

LINE = re.compile(
    r'^(?P<ip>\S+) \S+ (?P<user>\S+) \[(?P<time>[^\]]+)\] "(?P<host>[^"]*)" '
    r'"(?P<request>[^"]*)" (?P<status>\d{3}) (?P<size>\S+) "(?P<ua>[^"]*)"'
)

# 明显是爬虫/监控的 UA，不计入人次
BOT = re.compile(
    r'(?i)(bot|crawl|spider|slurp|curl|wget|python-requests|headless|'
    r'monitor|uptime|lighthouse|pagespeed|facebookexternalhit|telegrambot)'
)

# 静态资源与非页面请求：不算一次访问
ASSET = re.compile(
    r'\.(?:js|mjs|css|map|svg|png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|'
    r'json|txt|xml|pdf|zip|gz|mp4|webm)\b',
    re.I,
)

STATS_NAME = re.compile(r'(?:^|\s)/(?:[^?\s]*\/)?stats\.json')


def iter_lines(path: str):
    if path.endswith('.gz'):
        with gzip.open(path, 'rt', encoding='utf-8', errors='replace') as fh:
            yield from fh
    else:
        with open(path, 'r', encoding='utf-8', errors='replace') as fh:
            yield from fh


def log_files(log_path: str) -> list[str]:
    """当前日志 + 已轮转的 .1/.2/... 与 .gz 变体。"""
    d = os.path.dirname(log_path) or '.'
    base = os.path.basename(log_path)
    files = [log_path] if os.path.exists(log_path) else []
    if not os.path.isdir(d):
        return files
    for name in sorted(os.listdir(d)):
        if name == base or name.startswith(base + '.') or name.startswith(base + '-'):
            full = os.path.join(d, name)
            if os.path.isfile(full) and full not in files:
                files.append(full)
    return files


def count_visits(files: list[str], host_filter: str | None, since: str | None) -> tuple[int, dict]:
    days: set[tuple[str, str]] = set()
    skipped = {'parse': 0, 'host': 0, 'bot': 0, 'asset': 0, 'self': 0, 'status': 0, 'early': 0}
    seen_files = 0

    for path in files:
        try:
            lines = iter_lines(path)
            seen_files += 1
        except OSError:
            continue
        for line in lines:
            m = LINE.match(line.strip())
            if not m:
                skipped['parse'] += 1
                continue

            request = m.group('request')
            if host_filter and m.group('host') != host_filter:
                skipped['host'] += 1
                continue
            if BOT.search(m.group('ua')):
                skipped['bot'] += 1
                continue
            if STATS_NAME.search(request):
                skipped['self'] += 1
                continue
            if ASSET.search(request):
                skipped['asset'] += 1
                continue
            # 只算成功的页面访问；404/301/499 等不代表有人看到了内容
            if m.group('status')[0] not in ('2', '3'):
                skipped['status'] += 1
                continue

            # nginx 时间形如 28/Sep/2026:13:04:11 +0800
            stamp = m.group('time').split(':')[0]
            try:
                day = datetime.strptime(stamp, '%d/%b/%Y').strftime('%Y-%m-%d')
            except ValueError:
                skipped['parse'] += 1
                continue
            if since and day < since:
                skipped['early'] += 1
                continue

            days.add((day, m.group('ip')))

    return len(days), {'skipped': skipped, 'files': seen_files}


def write_atomic(out_path: str, payload: dict) -> None:
    d = os.path.dirname(os.path.abspath(out_path))
    os.makedirs(d, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=d, prefix='.stats-')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as fh:
            json.dump(payload, fh, ensure_ascii=False)
            fh.write('\n')
        os.replace(tmp, out_path)
        os.chmod(out_path, 0o644)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--log', required=True, help='nginx 访问日志路径（会一并读取轮转文件）')
    ap.add_argument('--out', default=None, help='输出 stats.json 的路径，需在站点根目录内；--dry-run 时可不给')
    ap.add_argument('--host', default=None, help='只统计该 host 的请求，例如 wweiqi.devs.surf')
    ap.add_argument('--since', default=None, help='起始日期 YYYY-MM-DD，之前的日志不计入')
    ap.add_argument('--dry-run', action='store_true', help='只打印结果，不写文件')
    args = ap.parse_args(argv)

    files = log_files(args.log)
    if not files:
        print(f'找不到日志：{args.log}', file=sys.stderr)
        return 1

    visits, detail = count_visits(files, args.host, args.since)
    payload = {
        'visits': visits,
        'metric': 'uv-day',
        'host': args.host,
        'since': args.since,
        'files': detail['files'],
        'updatedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'),
    }

    if args.dry_run:
        print(json.dumps({**payload, 'detail': detail}, ensure_ascii=False, indent=2))
        return 0

    if not args.out:
        print('真正写入需要 --out', file=sys.stderr)
        return 2

    if not visits:
        # 一条都没算出来：宁可不写，让前端整块不显示，也不上线一个 0
        print(f'没有匹配到访问记录（{detail}），未写入 {args.out}', file=sys.stderr)
        return 2

    write_atomic(args.out, payload)
    print(f'已写入 {args.out}：visits={visits} files={detail["files"]}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
