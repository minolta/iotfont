#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

IOT_SERVER="${IOT_SERVER:-192.168.88.5}"
IOT_SSH_USER="${IOT_SSH_USER:-ky}"
IOT_REMOTE_DIR="${IOT_REMOTE_DIR:-/home/ky/iot}"

[[ -n "${IOT_SSH_USER}" ]] || { echo "IOT_SSH_USER is required."; exit 1; }

SSH_TARGET="${IOT_SSH_USER}@${IOT_SERVER}"

for f in api.tar font.tar run.sh; do
  [[ -f "${f}" ]] || { echo "Missing ${f} — run makedocker.bat first."; exit 1; }
done

ssh "${SSH_TARGET}" "mkdir -p ${IOT_REMOTE_DIR}"
scp api.tar font.tar run.sh "${SSH_TARGET}:${IOT_REMOTE_DIR}/"

echo ""
echo "Copy finished. On server: cd ${IOT_REMOTE_DIR} && chmod +x run.sh && ./run.sh"
