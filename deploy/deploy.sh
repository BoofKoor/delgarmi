#!/usr/bin/env bash
# Ships the built images and the Compose files to the server, then restarts the stack.
# GitHub Actions runs this after the tests pass. It expects:
#   - images.tar.gz in the current directory (docker save of delgarmi-web and delgarmi-api)
#   - DEPLOY_HOST and DEPLOY_PORT in the environment
#   - the deploy user's private key in ~/.ssh/id_ed25519 and the server's host key in ~/.ssh/known_hosts
set -euo pipefail

host="${DEPLOY_HOST:?DEPLOY_HOST is not set}"
port="${DEPLOY_PORT:-22}"
user="${DEPLOY_USER:-deploy}"
dir="${DEPLOY_PATH:-/opt/delgarmi}"
ssh_opts=(-o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=20)

tar czf bundle.tar.gz docker-compose.yml deploy/nginx
echo "Uploading images and config to $user@<server>:$dir"
scp "${ssh_opts[@]}" -P "$port" images.tar.gz bundle.tar.gz "$user@$host:$dir/"
rm -f bundle.tar.gz

ssh "${ssh_opts[@]}" -p "$port" "$user@$host" "set -e
  cd '$dir'
  tar xzf bundle.tar.gz && rm bundle.tar.gz
  gunzip -c images.tar.gz | docker load && rm images.tar.gz
  docker compose up -d --remove-orphans --wait --wait-timeout 300
  docker image prune -f >/dev/null
  docker compose ps --format 'table {{.Service}}\t{{.Status}}'"
