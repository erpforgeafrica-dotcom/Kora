#!/usr/bin/env bash
set -euo pipefail

docker compose up -d postgres redis

echo "Install and run backend"
(
  cd backend
  npm install
  npm run dev
)

echo "Run worker in another shell"
echo "cd backend && npm run dev:worker"
