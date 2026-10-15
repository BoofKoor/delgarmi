#!/usr/bin/env bash
# Deploys the newest tested version. systemd runs this every minute (delgarmi-update.timer).
#
# GitHub Actions moves the `release` branch only after every test passes. This script fetches
# it; if it moved, it builds the new images and restarts the stack. If the new version does not
# come up healthy, it goes back to the previous one and skips the broken commit until a newer
# one arrives. Logs: journalctl -u delgarmi-update
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/delgarmi}"
STATE_DIR="${STATE_DIR:-/var/lib/delgarmi}"
BRANCH="${BRANCH:-release}"

deploy() {
  docker compose build --quiet && docker compose up -d --remove-orphans --wait --wait-timeout 300
}

main() {
  mkdir -p "$STATE_DIR"
  exec 9>"$STATE_DIR/update.lock"
  flock -n 9 || exit 0
  cd "$APP_DIR"

  # Exit code 2 means the branch does not exist yet (no green test run so far).
  local found=0
  git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1 || found=$?
  if [ "$found" = 2 ]; then echo "No '$BRANCH' branch on GitHub yet; nothing to deploy"; exit 0; fi
  git fetch --quiet origin "$BRANCH"
  local target current
  target="$(git rev-parse "origin/$BRANCH")"
  current="$(git rev-parse HEAD)"
  date -u +%FT%TZ >"$STATE_DIR/last-check"

  [ "$target" = "$current" ] && exit 0
  [ "$(cat "$STATE_DIR/failed" 2>/dev/null || true)" = "$target" ] && exit 0

  echo "Deploying ${target:0:7} (running ${current:0:7})"
  git checkout --quiet --force --detach "$target"
  if deploy; then
    docker image prune -f >/dev/null
    rm -f "$STATE_DIR/failed"
    echo "$target $(date -u +%FT%TZ)" >"$STATE_DIR/deployed"
    echo "Deployed ${target:0:7}"
  else
    echo "$target" >"$STATE_DIR/failed"
    echo "Deploy of ${target:0:7} failed; going back to ${current:0:7}" >&2
    git checkout --quiet --force --detach "$current"
    deploy || echo "Going back to ${current:0:7} failed too; check: docker compose ps" >&2
    exit 1
  fi
}

# One line, inside a function: bash has read all of it before `git checkout` replaces this file.
main "$@"; exit $?
