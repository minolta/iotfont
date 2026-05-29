# Add Job — User Manual

This guide explains how to create a **job** in IoT Admin. A job tells the system what to run on a device: which job type to use, when it runs, and optionally which GPIO ports or sensors are involved.

---

## Before you start

Make sure these exist in the system:

| Item | Menu | Why |
|------|------|-----|
| **Device** | Devices | Every job is assigned to one device |
| **Job type** | Job types | Defines how the job runs (e.g. humidity, schedule, GPIO) |
| **Job group** (optional) | Job groups | Limits jobs so only one in a group runs at a time |

Log in as an admin user (default: `admin` / `admin`).

---

## Open the Add Job page

**Way 1 — from the menu**

1. Open the web UI (e.g. http://192.168.88.5:8080).
2. Go to **Jobs** → **Add job**.

**Way 2 — from the Jobs list**

1. Go to **Jobs**.
2. Click **Add job** (top right).

**Way 3 — pre-select a device**

Open:

```
/jobs/new?deviceId=123
```

Replace `123` with the device ID. The **Device** field is filled automatically.

---

## Step-by-step: fill in the form

### 1. Basic information

| Field | Required | Description |
|-------|----------|-------------|
| **Name** | Yes | Short label for the job (e.g. `Greenhouse pump`) |
| **Description** | No | Extra notes about what this job does |

### 2. Assignment

| Field | Required | Description |
|-------|----------|-------------|
| **Device** | Yes | The device this job belongs to |
| **Job type** | Yes | How the job executes (from Job types) |
| **Job group** | No | Optional group; **only one job in the same group runs at a time** |

### 3. Enable and priority

| Field | Default | Description |
|-------|---------|-------------|
| **Enabled** | On | Disabled jobs are not executed |
| **Priority** | `0` | Higher number = higher priority when multiple jobs compete |

### 4. Timing

| Field | Required | Description |
|-------|----------|-------------|
| **Runtime (seconds)** | No | How long the job runs |
| **Wait time (seconds)** | No | Delay before or between actions (depends on job type) |
| **Start date** | No | Job is active only on or after this date/time |
| **End date** | No | Job is active only before this date/time |
| **Daily start time** | No | e.g. `09:00` — run only after this time each day |
| **Daily end time** | No | e.g. `17:00` — run only before this time each day |

Leave date/time fields empty if the job should run anytime (subject to job type rules).

### 5. Humidity range (for humidity job types)

Use when the job type is one of:

- `humidity`
- `runhbyd1`
- `readhumidity`

| Field | Description |
|-------|-------------|
| **Min humidity (%)** | GPIO ports run only if sensor reading ≥ this value |
| **Max humidity (%)** | GPIO ports run only if sensor reading ≤ this value |

Leave blank to accept any humidity value.

**Example:** Min `40`, Max `70` → ports activate only when humidity is between 40% and 70%.

### 6. Temperature range (for temperature job types)

Use when the job type is one of:

- `readht`
- `ReadH/T`
- `temperature`

| Field | Description |
|-------|-------------|
| **Min temperature (°C)** | GPIO ports run only if reading ≥ this value |
| **Max temperature (°C)** | GPIO ports run only if reading ≤ this value |

Leave blank for any temperature.

---

## GPIO ports (optional)

Click **+ Add port** to control device outputs when the job runs.

Each port row:

| Field | Required | Description |
|-------|----------|-------------|
| **Target device** | Yes | Device that owns the GPIO pin |
| **GPIO port** | Yes | Port name on the device (e.g. `D1`, `D2`) |
| **Logic** | Yes | `High` or `Low` — output state |
| **Runtime (s)** | No | How long to hold the port state |
| **Wait time (s)** | No | Wait before/after this port action |
| **Enabled** | — | Turn this port action on or off |

You can add multiple ports. Click **Remove** on a row to delete it.

---

## Sensors (optional)

Click **+ Add sensor** to read data from a device HTTP endpoint when the job runs.

Each sensor row:

| Field | Required | Description |
|-------|----------|-------------|
| **Sensor device** | Yes | Device to read from |
| **Name** | No | Label for your reference |
| **Type** | Yes | `humidity`, `volt`, or `generic` |
| **Read path** | Yes | HTTP path on the device IP (default `/`, e.g. `/status`) |
| **Enabled** | — | Include this sensor in the job |

---

## Save the job

1. Review all required fields (marked with validation if missing).
2. Click **Create job**.
3. On success you return to the **Jobs** list with a message: `Job #… created.`

To change a job later: **Jobs** → click the job name → **Edit**.

---

## Example: humidity-controlled fan

**Goal:** Turn on GPIO `D1` on device #5 when humidity is between 45% and 65%, during daytime only.

| Field | Value |
|-------|-------|
| Name | `Fan on humidity` |
| Device | `#5 — Greenhouse controller` |
| Job type | `humidity` |
| Enabled | ✓ |
| Daily start time | `08:00` |
| Daily end time | `18:00` |
| Min humidity | `45` |
| Max humidity | `65` |

**GPIO port 1:**

| Field | Value |
|-------|-------|
| Target device | `#5` |
| GPIO port | `D1` |
| Logic | `High` |
| Runtime | `300` (5 minutes) |

Click **Create job**.

---

## Example: simple scheduled job

**Goal:** Run a job type with no sensor conditions.

| Field | Value |
|-------|-------|
| Name | `Daily check` |
| Device | Your device |
| Job type | (pick from list) |
| Enabled | ✓ |
| Priority | `10` |

Leave humidity/temperature ranges and ports/sensors empty if not needed.

---

## Troubleshooting

| Problem | What to do |
|---------|------------|
| **Device** or **Job type** list is empty | Add devices and job types first |
| “Name is required” / “Device is required” | Fill all required fields and submit again |
| “Could not create job” | Check API is running; open browser dev tools → Network for error details |
| Job created but never runs | Check **Enabled**, date range, daily times, and job type rules |
| Ports never trigger | Confirm humidity/temperature range matches job type and current readings |

---

## Related pages

| Page | Purpose |
|------|---------|
| **Jobs** | List, search, filter by device, edit, delete, clone |
| **Import jobs** | Bulk import from JSON export |
| **Running tasks** | See jobs currently executing |
| **Devices** | Manage devices linked to jobs |

See also [README.md](README.md) for deployment and login.
