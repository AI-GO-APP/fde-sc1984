#!/bin/sh
# 一鍵部署 Admin + Ordering App 到 AI GO 平台
# 用法：./scripts/deploy.sh
set -e
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

echo "=== 部署 Admin App ==="
python3 scripts/deploy_admin.py

echo ""
echo "=== 部署 Ordering App ==="
python3 scripts/deploy_ordering.py
