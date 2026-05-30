# AGENTS.md — IoT Admin (iot-font)

This repository is the **Angular web UI** (`iot-font`). It talks to a separate Spring Boot backend.

## Backend API (separate repo)

| | |
|---|---|
| **Path** | `f:\src\piproject\api\iot` |
| **Stack** | Kotlin, Spring Boot, JPA/H2 |
| **Base URL (prod/Docker)** | `http://SERVER:888` |
| **Base URL (local Spring Boot)** | `http://localhost:8080` |

When changing REST contracts, entities, job workers, or business logic, **edit the API project**, not only this UI.

### API layout (`me.pixka.iot`)

| Package | Role |
|---------|------|
| `d/` | JPA entities (`Job`, `Device`, `JobLog`, …) |
| `r/` | Spring Data repositories |
| `s/` | Services (`JobService`, `TaskService`, …) |
| `c/` | REST controllers under `/rest/iot/*` |
| `o/` | DTOs / request objects |
| `run/` | Job workers (`HumidityJobWorker`, `LoggingJobWorker`, …) |

Build API: `cd f:\src\piproject\api\iot && mvn -DskipTests compile`  
Docker image: built from API folder via `makedocker.bat` in this repo.

---

## This repo (iot-font)

| | |
|---|---|
| **Stack** | Angular 21, standalone components, signals |
| **App root** | `src/app/` |
| **Shared CRUD styles** | `src/app/shared/crud-page.css` |
| **API base token** | `src/app/api/iot-api-base-url.token.ts` (empty = same-origin `/rest`) |

### Local dev

```bash
npm install
npm start          # UI http://localhost:4200 → API proxy :8080
```

Proxy: `proxy.conf.dev.json` → `http://localhost:8080`  
Docker API only: `npm run start:docker-api` → port `888`

### UI feature folders

| Folder | Purpose |
|--------|---------|
| `src/app/device/` | Devices, import, live info |
| `src/app/job/` | Jobs, ports, sensors, job-type guides |
| `src/app/job-log/` | Job run logs viewer |
| `src/app/job-type/`, `job-group/` | Job metadata CRUD |
| `src/app/humidity/`, `readv/` | Time-series readings |
| `src/app/task/` | Running tasks (live) |
| `src/app/auth/`, `user/` | Login and users |

### Frontend ↔ API conventions

- JSON fields from API use **snake_case** (`device_id`, `enable_logs`, `jobtype_id`).
- Form/models in UI often use **camelCase** (`deviceId`, `enableLogs`); map in `*.service.ts` `toPayload()`.
- TypeScript interfaces comment the matching Kotlin type, e.g. `me.pixka.iot.d.Job`.
- New list pages: follow `job-list` (search + filters) or `readv-page` (date range + pagination).
- New CRUD pages: use `crud-page.css`, reactive forms, `formatHttpError`, standalone components.

### Deploy

| Script | Action |
|--------|--------|
| `makedocker.bat` | Build **both** API + UI images, save tar, upload to server |
| `makedocker-font.bat` | UI image only |
| `deploy-font-to-server.bat` | Build UI, upload `font.tar`, restart `iot-font` container |
| `run.bat` | SSH to server and run `run.sh` |

Server UI: `http://SERVER:8080` · API: `http://SERVER:888`

---

## Full-stack workflow

1. **API first** — entity, repository, service, controller in `f:\src\piproject\api\iot`.
2. **UI second** — model, service, component in this repo; match existing patterns.
3. **Job behavior** — workers live in API `run/`; UI only configures jobs and displays results/logs.
4. **Verify** — `mvn -DskipTests compile` (API) and `npm run build` (UI).

## Docs in this repo

- `README.md` — deploy and troubleshooting
- `docs/add-job-manual.md` — job form field reference
