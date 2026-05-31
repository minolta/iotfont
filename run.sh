#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

NETWORK="${IOT_DOCKER_NETWORK:-iot-net}"
DB_DIR="${IOT_DB_DIR:-/home/ky/iot/db}"
LOG_DIR="${IOT_LOG_DIR:-/home/ky/iot/logs}"
NETWORK_SCAN_FILE="${IOT_NETWORK_SCAN_FILE:-/home/ky/iot/network_scan.json}"
IPT_MOUNT="/app/ipt/network_scan.json"

wait_for_api() {
  echo "Waiting for API on port 888..."
  for i in $(seq 1 90); do
    if curl -sf http://127.0.0.1:888/rest/iot/time/now >/dev/null 2>&1; then
      echo "API is up."
      return 0
    fi
    if [[ "${i}" -eq 90 ]]; then
      echo "API failed to start. Logs:"
      docker logs iot-api --tail 40 || true
      return 1
    fi
    sleep 2
  done
}

# ./run.sh       = load images + start containers
# ./run.sh run   = start containers only (images already loaded)
if [[ "${1:-}" != "run" ]]; then
  [[ -f api.tar ]] || { echo "Missing api.tar"; exit 1; }
  [[ -f font.tar ]] || { echo "Missing font.tar"; exit 1; }
  echo "Loading images..."
  docker load -i api.tar
  docker load -i font.tar
fi

mkdir -p "${DB_DIR}" "${LOG_DIR}" "$(dirname "${NETWORK_SCAN_FILE}")"
if [[ ! -f "${NETWORK_SCAN_FILE}" ]]; then
  echo '[]' > "${NETWORK_SCAN_FILE}"
  echo "Created empty IP scan file: ${NETWORK_SCAN_FILE}"
fi
if command -v sudo >/dev/null 2>&1; then
  sudo -n chown -R 1001:1001 "${DB_DIR}" "${LOG_DIR}" 2>/dev/null || true
  sudo -n chmod -R u+rwX "${DB_DIR}" "${LOG_DIR}" 2>/dev/null || true
else
  chown -R 1001:1001 "${DB_DIR}" "${LOG_DIR}" 2>/dev/null || true
  chmod -R u+rwX "${DB_DIR}" "${LOG_DIR}" 2>/dev/null || true
fi

echo "Stopping old containers..."
docker rm -f iot-font iot-api 2>/dev/null || true

echo "Creating network ${NETWORK}..."
docker network inspect "${NETWORK}" >/dev/null 2>&1 || docker network create "${NETWORK}"

echo "Starting iot-api..."
docker run -d \
  --name iot-api \
  --hostname iot-api \
  --network "${NETWORK}" \
  --network-alias iot-api \
  --restart unless-stopped \
  -p 888:8080 \
  -v "${DB_DIR}:/app/data" \
  -v "${LOG_DIR}:/app/logs" \
  -v "${NETWORK_SCAN_FILE}:${IPT_MOUNT}:ro" \
  -e IOT_SEED_TEST_DATA=true \
  -e IOT_SECURITY_SEED_ADMIN=true \
  -e IOT_SECURITY_ADMIN_USERNAME=admin \
  -e IOT_SECURITY_ADMIN_PASSWORD=admin \
  -e IOT_DEVICE_IP_SCAN_ENABLED=true \
  -e IOT_DEVICE_IP_SCAN_FILE_PATH="${IPT_MOUNT}" \
  -e IOT_DEVICE_IP_SCAN_INTERVAL_MS=600000 \
  -e IOT_CORS_ALLOWED_ORIGIN_PATTERNS="http://localhost:*,http://127.0.0.1:*,http://192.168.*:*" \
  iot-api:latest

wait_for_api

echo "Starting iot-font..."
docker run -d \
  --name iot-font \
  --network "${NETWORK}" \
  --restart unless-stopped \
  -p 8080:80 \
  iot-font:latest

echo "Checking proxy from iot-font to iot-api..."
sleep 2
if docker exec iot-font wget -qO- http://iot-api:8080/rest/iot/time/now >/dev/null 2>&1; then
  echo "Proxy path OK."
else
  echo "WARNING: iot-font cannot reach iot-api. Check: docker logs iot-font"
fi

echo ""
echo "UI:  http://192.168.88.5:8080"
echo "API: http://192.168.88.5:888"
echo "Test: curl http://127.0.0.1:8080/rest/iot/time/now"
