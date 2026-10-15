#!/usr/bin/env bash
# Delgarmi server installer.
#
# Run once as root on a fresh Ubuntu (22.04 or 24.04) or Debian (12) server:
#
#     bash install-delgarmi.sh
#
# It installs Docker, opens the firewall, waits for DNS, gets the HTTPS certificate and sets up
# its renewal, creates the secrets, builds and starts the site, and turns on automatic updates:
# every minute the server deploys the newest commit that passed the tests on GitHub.
#
# The one manual step: when asked, add the printed read-only deploy key to the GitHub repository.
# Safe to run again: it keeps existing secrets, certificates and data.
set -Eeuo pipefail

DOMAIN="${DOMAIN:-test.delgarmi.com}"
GITHUB_REPO="${GITHUB_REPO:-BoofKoor/delgarmi}"
BRANCH="${BRANCH:-release}"
APP_DIR="${APP_DIR:-/opt/delgarmi}"
STATE_DIR="${STATE_DIR:-/var/lib/delgarmi}"
DEPLOY_KEY="${DEPLOY_KEY:-/root/.ssh/delgarmi_deploy}"
LOG="${LOG:-/var/log/delgarmi-install.log}"
# Rehearsal in a sandbox only: self-signed certificate, no DNS check, swap or systemd, and a
# repository URL of our choosing. Never set these on a real server.
TEST_MODE="${DELGARMI_TEST_MODE:-0}"
REPO_URL="${REPO_URL:-}"

# GitHub's published Ed25519 host key, the same for github.com and ssh.github.com:443.
# Fingerprint SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU (docs.github.com).
GITHUB_HOST_KEY='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl'

if [ -t 1 ]; then B=$'\033[1m' G=$'\033[32m' Y=$'\033[33m' R=$'\033[31m' N=$'\033[0m'; else B='' G='' Y='' R='' N=''; fi
step() { printf '\n%s==> %s%s\n' "$B" "$*" "$N"; }
ok() { printf '    %s[ok]%s %s\n' "$G" "$N" "$*"; }
note() { printf '    %s[!]%s %s\n' "$Y" "$N" "$*"; }
fail() { printf '\n%sERROR:%s %s\n' "$R" "$N" "$*" >&2; exit 1; }
trap 'fail "Command failed at line $LINENO: $BASH_COMMAND (full log: $LOG)"' ERR

SSH_CMD="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=15"
CLONE_URL=""

check_server() {
  step "Checking the server"
  [ "$(id -u)" -eq 0 ] || fail "Run this as root (for example: sudo -i, then run it again)."
  # shellcheck disable=SC1091
  . /etc/os-release
  case "${ID:-}" in
    ubuntu | debian) ok "${PRETTY_NAME:-$ID}" ;;
    *) fail "Only Ubuntu and Debian are supported (this is ${PRETTY_NAME:-unknown})." ;;
  esac
  local mem_mb
  mem_mb=$(($(awk '/MemTotal/ {print $2}' /proc/meminfo) / 1024))
  [ "$mem_mb" -ge 900 ] || fail "At least 1 GB of RAM is needed (2 GB recommended); this server has ${mem_mb} MB."
  ok "${mem_mb} MB RAM, $(nproc) CPU"
}

install_packages() {
  step "Installing system packages"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl git openssl iproute2 certbot >/dev/null
  ok "curl, git, openssl, certbot"
}

check_ports() {
  local busy
  busy=$(ss -ltnpH 2>/dev/null | awk '$4 ~ /:(80|443)$/' || true)
  if [ -z "$busy" ]; then ok "Ports 80 and 443 are free"; return; fi
  # On a re-run our own nginx holds them; it answers this path with "ok".
  if [ "$(curl -s --max-time 3 http://127.0.0.1/nginx-health)" = "ok" ]; then ok "Ports 80 and 443 belong to this site's nginx"; return; fi
  fail "Ports 80 or 443 are already used by another program:"$'\n'"$busy"$'\n'"Use a server where both are free."
}

install_docker() {
  step "Docker"
  if command -v docker >/dev/null 2>&1; then
    ok "Already installed: $(docker --version)"
  else
    curl -fsSL https://get.docker.com | sh >/dev/null
    ok "Installed $(docker --version)"
  fi
  [ "$TEST_MODE" = 1 ] || systemctl enable --now docker >/dev/null 2>&1
  # Building the images needs the Compose and Buildx plugins; add them if this Docker lacks them.
  if ! docker compose version >/dev/null 2>&1 || ! docker buildx version >/dev/null 2>&1; then
    apt-get install -y -qq docker-compose-plugin docker-buildx-plugin >/dev/null 2>&1 ||
      apt-get install -y -qq docker-compose-v2 docker-buildx >/dev/null 2>&1 || true
  fi
  docker compose version >/dev/null 2>&1 || fail "Docker Compose is missing and could not be installed."
  docker buildx version >/dev/null 2>&1 || fail "Docker Buildx is missing and could not be installed."
  ok "$(docker compose version), buildx $(docker buildx version | awk '{print $2}')"
}

add_swap() {
  [ "$TEST_MODE" = 1 ] && return
  step "Memory"
  if [ -n "$(swapon --show --noheadings)" ]; then ok "Swap is already on"; return; fi
  if [ "$(awk '/MemTotal/ {print $2}' /proc/meminfo)" -ge 3500000 ]; then ok "Enough RAM; no swap needed"; return; fi
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
  ok "Added 2 GB of swap (building the site needs it on small servers)"
}

open_firewall() {
  step "Firewall"
  if command -v ufw >/dev/null && ufw status | grep -q '^Status: active'; then
    ufw allow 80/tcp >/dev/null
    ufw allow 443/tcp >/dev/null
    ok "ufw: opened 80 and 443"
  else
    ok "ufw is not active; nothing to open"
  fi
}

public_ip() {
  local url ip
  for url in https://api.ipify.org https://ifconfig.me/ip https://icanhazip.com; do
    ip=$(curl -4 -fsS --max-time 8 "$url" 2>/dev/null | tr -d '[:space:]') || continue
    if [[ $ip =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then echo "$ip"; return 0; fi
  done
  return 1
}

wait_for_dns() {
  [ "$TEST_MODE" = 1 ] && return
  step "DNS for $DOMAIN"
  local me seen="" i
  me=$(public_ip) || fail "Could not find this server's public IPv4 address."
  for i in $(seq 1 60); do
    seen=$(getent ahostsv4 "$DOMAIN" | awk 'NR == 1 {print $1}' || true)
    if [ "$seen" = "$me" ]; then ok "$DOMAIN points to this server ($me)"; return; fi
    [ "$i" -eq 1 ] && note "$DOMAIN points to ${seen:-nothing yet}; this server is $me. Waiting for DNS (up to 20 minutes)..."
    sleep 20
  done
  fail "$DOMAIN points to ${seen:-nothing}, not to this server ($me). Add an A record for it with value $me (no proxy) and run this again."
}

can_read() {
  GIT_SSH_COMMAND="$SSH_CMD" git ls-remote --heads "$1" >/dev/null 2>&1
}

github_access() {
  step "Read access to github.com/$GITHUB_REPO"
  install -d -m 700 /root/.ssh
  local known=/root/.ssh/known_hosts
  touch "$known"
  chmod 600 "$known"
  grep -qxF "github.com $GITHUB_HOST_KEY" "$known" || echo "github.com $GITHUB_HOST_KEY" >>"$known"
  grep -qxF "[ssh.github.com]:443 $GITHUB_HOST_KEY" "$known" || echo "[ssh.github.com]:443 $GITHUB_HOST_KEY" >>"$known"
  [ -f "$DEPLOY_KEY" ] || ssh-keygen -q -t ed25519 -N "" -C "delgarmi-server-$(hostname)" -f "$DEPLOY_KEY"

  # Port 22 first; ssh.github.com on 443 when a network blocks 22.
  local urls=("git@github.com:$GITHUB_REPO.git" "ssh://git@ssh.github.com:443/$GITHUB_REPO.git")
  [ -n "$REPO_URL" ] && urls=("$REPO_URL")
  local url i shown=0
  for i in $(seq 1 180); do
    for url in "${urls[@]}"; do
      if can_read "$url"; then CLONE_URL="$url"; ok "Read access works ($url)"; return; fi
    done
    if [ "$shown" = 0 ]; then
      shown=1
      cat <<MSG

    This server needs read-only access to the code. Do this once:

      1. Open  https://github.com/$GITHUB_REPO/settings/keys/new
      2. Title:  delgarmi server
      3. Key:    $(cat "$DEPLOY_KEY.pub")
      4. Leave "Allow write access" unticked and press "Add key".

    Waiting for the key: checking every 10 seconds for up to 30 minutes...

MSG
    fi
    sleep 10
  done
  fail "No read access after 30 minutes. Add the deploy key above and run this again."
}

fetch_code() {
  step "Code"
  local branch="$BRANCH"
  if ! GIT_SSH_COMMAND="$SSH_CMD" git ls-remote --exit-code --heads "$CLONE_URL" "$branch" >/dev/null 2>&1; then
    note "No '$branch' branch yet (it appears after the first green test run); starting from main"
    branch=main
  fi
  if [ -d "$APP_DIR/.git" ]; then
    git -C "$APP_DIR" remote set-url origin "$CLONE_URL"
  else
    if [ -d "$APP_DIR" ] && [ -n "$(ls -A "$APP_DIR")" ]; then
      local kept
      kept="$APP_DIR.before-install-$(date +%Y%m%d%H%M%S)"
      mv "$APP_DIR" "$kept"
      note "Moved the old $APP_DIR to $kept"
    fi
    GIT_SSH_COMMAND="$SSH_CMD" git clone --quiet "$CLONE_URL" "$APP_DIR"
  fi
  git -C "$APP_DIR" config core.sshCommand "$SSH_CMD"
  git -C "$APP_DIR" fetch --quiet origin "$branch"
  git -C "$APP_DIR" checkout --quiet --force --detach "origin/$branch"
  ok "$(git -C "$APP_DIR" log -1 --format='%h  %s' | cut -c1-72)"
}

write_secrets() {
  step "Settings and secrets"
  local env="$APP_DIR/.env"
  if [ -f "$env" ]; then
    ok "Keeping the existing $env"
    grep -qx "SITE_DOMAIN=$DOMAIN" "$env" || note "$env is set up for another domain; leaving it unchanged"
    return
  fi
  (
    umask 077
    cat >"$env" <<EOF
SITE_DOMAIN=$DOMAIN
DJANGO_ALLOWED_HOSTS=$DOMAIN
DJANGO_SECRET_KEY=$(openssl rand -hex 48)
PANEL_PATH=panel-$(openssl rand -hex 4)
POSTGRES_DB=delgarmi
POSTGRES_USER=delgarmi
POSTGRES_PASSWORD=$(openssl rand -hex 24)
EOF
  )
  ok "Created $env with new random secrets"
}

get_certificate() {
  step "HTTPS certificate for $DOMAIN"
  local live="/etc/letsencrypt/live/$DOMAIN"
  if [ -f "$live/fullchain.pem" ]; then
    ok "Already present"
  elif [ "$TEST_MODE" = 1 ]; then
    mkdir -p "$live"
    openssl req -x509 -newkey rsa:2048 -nodes -days 30 -subj "/CN=$DOMAIN" -addext "subjectAltName=DNS:$DOMAIN" \
      -keyout "$live/privkey.pem" -out "$live/fullchain.pem" 2>/dev/null
    ok "Test mode: self-signed certificate"
  else
    (cd "$APP_DIR" && docker compose stop nginx >/dev/null 2>&1) || true
    certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --quiet ||
      fail "Let's Encrypt could not reach $DOMAIN on port 80. If the provider has its own firewall, open 80 and 443 there and run this again."
    ok "Issued by Let's Encrypt"
  fi
  # Renewal needs port 80 for a few seconds every ~60 days, so nginx steps aside meanwhile.
  install -d /etc/letsencrypt/renewal-hooks/pre /etc/letsencrypt/renewal-hooks/post
  printf '#!/bin/sh\ncd %s && docker compose stop nginx || true\n' "$APP_DIR" >/etc/letsencrypt/renewal-hooks/pre/delgarmi.sh
  printf '#!/bin/sh\ncd %s && docker compose start nginx || true\n' "$APP_DIR" >/etc/letsencrypt/renewal-hooks/post/delgarmi.sh
  chmod 755 /etc/letsencrypt/renewal-hooks/pre/delgarmi.sh /etc/letsencrypt/renewal-hooks/post/delgarmi.sh
  ok "Renewal hooks installed"
}

start_site() {
  step "Building and starting the site (the first build takes a few minutes)"
  cd "$APP_DIR"
  # Build and start quietly; the full output goes to the log, and to the screen only on failure.
  local out
  out=$(mktemp)
  if ! { docker compose build --quiet && docker compose up -d --remove-orphans --wait --wait-timeout 600; } >"$out" 2>&1; then
    cat "$out" >>"$LOG"
    tail -n 40 "$out"
    fail "The site did not start. More: cd $APP_DIR && docker compose logs"
  fi
  cat "$out" >>"$LOG"
  rm -f "$out"
  docker compose ps --format 'table {{.Service}}\t{{.Status}}' | sed 's/^/    /'
  echo "$(git rev-parse HEAD) $(date -u +%FT%TZ)" >"$STATE_DIR/deployed"
}

enable_updates() {
  step "Automatic updates"
  cat >/etc/systemd/system/delgarmi-update.service <<EOF
[Unit]
Description=Deploy the newest tested version of Delgarmi
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
Environment=APP_DIR=$APP_DIR STATE_DIR=$STATE_DIR BRANCH=$BRANCH
ExecStart=$APP_DIR/deploy/update.sh
TimeoutStartSec=30min
EOF
  cat >/etc/systemd/system/delgarmi-update.timer <<'EOF'
[Unit]
Description=Check GitHub every minute for a new tested version of Delgarmi

[Timer]
OnBootSec=2min
OnUnitInactiveSec=1min

[Install]
WantedBy=timers.target
EOF
  chmod 644 /etc/systemd/system/delgarmi-update.service /etc/systemd/system/delgarmi-update.timer
  {
    echo '#!/usr/bin/env bash'
    echo '# delgarmi [status|update|logs]'
    echo "APP_DIR=$APP_DIR STATE_DIR=$STATE_DIR DOMAIN=$DOMAIN"
    cat <<'EOF'
set -uo pipefail
case "${1:-status}" in
  status)
    echo "Running:     $(cut -c1-7 "$STATE_DIR/deployed" 2>/dev/null || echo unknown), deployed $(cut -d' ' -f2 "$STATE_DIR/deployed" 2>/dev/null)"
    echo "Last check:  $(cat "$STATE_DIR/last-check" 2>/dev/null || echo never)"
    [ -f "$STATE_DIR/failed" ] && echo "Skipped:     $(cut -c1-7 "$STATE_DIR/failed") failed to deploy; waiting for a newer commit"
    echo "Health:      HTTP $(curl -sk -o /dev/null -w '%{http_code}' --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/api/health" 2>/dev/null)"
    echo "Certificate: valid until $(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" 2>/dev/null | cut -d= -f2)"
    (cd "$APP_DIR" && docker compose ps --format 'table {{.Service}}\t{{.Status}}')
    ;;
  update) systemctl start delgarmi-update.service; journalctl -u delgarmi-update -n 20 --no-pager ;;
  logs) journalctl -u delgarmi-update -n 50 --no-pager; (cd "$APP_DIR" && docker compose logs --tail 30) ;;
  *) echo "usage: delgarmi [status|update|logs]"; exit 2 ;;
esac
EOF
  } >/usr/local/bin/delgarmi
  chmod 755 /usr/local/bin/delgarmi
  if [ "$TEST_MODE" = 1 ]; then
    note "Test mode: timer written but not started"
    return
  fi
  systemctl daemon-reload
  systemctl enable --now delgarmi-update.timer >/dev/null 2>&1
  ok "On: about a minute after the tests pass on GitHub, the server deploys the new version"
}

check_site() {
  step "Checking the site"
  local insecure=() code
  [ "$TEST_MODE" = 1 ] && insecure=(-k)
  code=$(curl "${insecure[@]}" -s -o /dev/null -w '%{http_code}' --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/api/health" || true)
  [ "$code" = 200 ] || fail "The site did not answer (HTTP $code). See: cd $APP_DIR && docker compose logs"
  ok "https://$DOMAIN answers"
  if [ "$TEST_MODE" != 1 ]; then
    if certbot renew --dry-run --cert-name "$DOMAIN" --quiet; then ok "Certificate renewal test passed"; else note "Renewal test failed; check that port 80 is open in the provider's firewall"; fi
    (cd "$APP_DIR" && docker compose start nginx >/dev/null 2>&1) || true
  fi
}

summary() {
  local panel
  panel=$(grep '^PANEL_PATH=' "$APP_DIR/.env" | cut -d= -f2)
  cat <<EOF

${G}Done.${N}
    Site:        https://$DOMAIN
    Components:  https://$DOMAIN/design-system
    Team panel:  https://$DOMAIN/$panel/
                 first login: cd $APP_DIR && docker compose exec api python manage.py createsuperuser
    Status:      delgarmi status
    Updates:     automatic, from the tested 'release' branch on GitHub
    Install log: $LOG
EOF
}

main() {
  umask 022
  mkdir -p "$(dirname "$LOG")" "$STATE_DIR"
  exec > >(tee -a "$LOG") 2>&1
  # Hold the update lock so the timer never deploys halfway through an install.
  exec 9>"$STATE_DIR/update.lock"
  flock 9
  check_server
  install_packages
  check_ports
  install_docker
  add_swap
  open_firewall
  wait_for_dns
  github_access
  fetch_code
  write_secrets
  get_certificate
  start_site
  enable_updates
  check_site
  summary
}

main "$@"; exit $?
