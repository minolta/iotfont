#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

IOT_SERVER="${IOT_SERVER:-192.168.88.5}"
IOT_SSH_USER="${IOT_SSH_USER:-}"
IOT_REMOTE_DIR="${IOT_REMOTE_DIR:-/opt/iot}"

[[ -f api.tar ]] || { echo "Building images..."; cmd.exe //c makedocker.bat; }

export IOT_SERVER IOT_SSH_USER IOT_REMOTE_DIR
./copy-to-server.sh

SSH_TARGET="${IOT_SSH_USER}@${IOT_SERVER}"
echo ""
echo "Deploying on server ..."
ssh "${SSH_TARGET}" "cd ${IOT_REMOTE_DIR} && chmod +x load-and-run.sh && ./load-and-run.sh"

echo ""
echo "UI:  http://${IOT_SERVER}:8080"
echo "API: http://${IOT_SERVER}:888"
