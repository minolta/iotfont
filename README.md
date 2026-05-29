# IoT Admin — User Manual

Web UI for the IoT backend. Deploy with Docker: **iot-api** (Spring Boot) and **iot-font** (Angular + nginx).

## Architecture

```
Browser  →  http://SERVER:8080  (iot-font / nginx)
                └─ /rest/*  →  iot-api:8080  (Docker network iot-net)

Direct API  →  http://SERVER:888
```

| Service   | Image            | Host port | Container port |
|-----------|------------------|-----------|------------------|
| UI        | `iot-font:latest`| 8080      | 80               |
| API       | `iot-api:latest` | 888       | 8080             |

Database files are stored on the server at `/home/ky/iot/db` (H2).

---

## Prerequisites

**Development PC (Windows)**

- Docker Desktop
- OpenSSH client (`ssh`, `scp`) with key login to the server
- Node.js (only for local `ng serve`)

**Server (Linux)**

- Docker
- SSH access
- Ports **8080** (UI) and **888** (API) open

---

## Server settings

Edit these in `makedocker.bat` and `run.bat` (or use `makedocker.local.bat`, gitignored):

| Variable         | Default              | Description        |
|------------------|----------------------|--------------------|
| `IOT_SSH_USER`   | `ky`                 | SSH username       |
| `IOT_SERVER`     | `192.168.88.5`       | Server IP          |
| `IOT_REMOTE_DIR` | `/home/ky/iot`       | Deploy folder      |

Example local override — copy `makedocker.local.bat.example` to `makedocker.local.bat`:

```bat
set "IOT_SSH_USER=ky"
set "IOT_SERVER=192.168.88.5"
set "IOT_REMOTE_DIR=/home/ky/iot"
```

Set up SSH keys once (no password prompt):

```bash
ssh-copy-id ky@192.168.88.5
```

---

## Deploy from Windows

### 1. Build images and upload

```bat
makedocker.bat
```

This will:

1. Build `iot-api:latest` from `../../api/iot`
2. Build `iot-font:latest` from this project
3. Save `api.tar` and `font.tar`
4. Copy to the server: `api.tar`, `font.tar`, `run.sh`

### 2. Start on server

**Option A — on the server:**

```bash
cd /home/ky/iot
chmod +x run.sh
./run.sh
```

**Option B — from Windows (SSH):**

```bat
run.bat
```

**Full deploy (build + upload + start):**

```bat
deploy-to-server.bat
```

### 3. Restart without reloading images

On server:

```bash
./run.sh run
```

From Windows:

```bat
run.bat run
```

---

## Access the application

| What        | URL |
|-------------|-----|
| **Web UI**  | http://192.168.88.5:8080 |
| **Login**   | http://192.168.88.5:8080/login |
| **API**     | http://192.168.88.5:888 |

**Default login:** `admin` / `admin`

The UI calls the API via same-origin `/rest/...` (nginx proxies to `iot-api`). You normally only open port **8080** in the browser.

---

## Files on the server

After deploy, `/home/ky/iot/` contains:

| File        | Purpose |
|-------------|---------|
| `api.tar`   | API Docker image |
| `font.tar`  | UI Docker image |
| `run.sh`    | Load images and start containers |
| `db/`       | H2 database (created at runtime) |
| `logs/`     | API log files |

---

## What `run.sh` does

Uses **`docker run`** (not Docker Compose):

1. Load `api.tar` and `font.tar` (unless `./run.sh run`)
2. Create Docker network `iot-net`
3. Start **iot-api** (wait until API responds on port 888)
4. Start **iot-font** (nginx proxies `/rest/` to API)
5. Verify connectivity inside the network

---

## Local development

**UI only:**

```bash
npm install
ng serve
```

Open http://localhost:4200 — API requests are proxied via `proxy.conf.json`.

**API (pick one):**

| How you run the API | Proxy target in `proxy.conf.json` |
|---------------------|-----------------------------------|
| Spring Boot locally (`server.port=8080`) | `http://localhost:8080` |
| Docker API only (`iot-api` on host port 888) | `http://localhost:888` |

Restart `ng serve` after changing the proxy file.

**Run both images locally (Git Bash):**

```bat
run.bat local
```

UI: http://localhost:8080 · API: http://localhost:888

---

## Troubleshooting

### 502 Bad Gateway on login or `/rest/...`

nginx cannot reach the API.

```bash
docker ps
docker logs iot-api --tail 50
curl http://127.0.0.1:888/rest/iot/time/now
curl http://127.0.0.1:8080/rest/iot/time/now
```

- If **888 works** but **8080 fails** → rebuild and redeploy **iot-font** (`makedocker.bat`, then `./run.sh`).
- If **888 fails** → API is not running (see DB permissions below).

### Invalid username or password

Default is `admin` / `admin`. After redeploy, the API re-syncs the admin password from environment variables.

Reset database if needed:

```bash
cd /home/ky/iot
docker rm -f iot-api iot-font
sudo rm -f db/iot.mv.db db/iot.trace.db
./run.sh run
```

### Database / permission errors

API runs as UID **1001** inside the container:

```bash
sudo mkdir -p /home/ky/iot/db /home/ky/iot/logs
sudo chown -R 1001:1001 /home/ky/iot/db /home/ky/iot/logs
./run.sh run
```

### `run.sh` line ending errors

If you see `bash\r: No such file or directory`:

```bash
sed -i 's/\r$//' run.sh
chmod +x run.sh
./run.sh
```

(`copy-to-server.bat` normalizes line endings before upload.)

---

## Script reference

| Script | Where | Purpose |
|--------|-------|---------|
| `makedocker.bat` | Windows | Build images, save tar, upload to server |
| `copy-to-server.bat` | Windows | Upload only (called by makedocker) |
| `run.bat` | Windows | SSH to server and run `run.sh` |
| `deploy-to-server.bat` | Windows | `makedocker.bat` + `run.bat` |
| `run.sh` | Server | Load images and `docker run` both containers |

---

## Building from source (without Docker)

```bash
# UI
npm ci
npm run build
# output: dist/iotfont/browser

# API — see ../../api/iot
```

Production images bundle the UI build into nginx and the API into a JRE container; use `makedocker.bat` for server deployment.

---

## User guides

- [Add Job — User Manual](docs/add-job-manual.md) — step-by-step guide to create jobs, GPIO ports, sensors, and schedules
