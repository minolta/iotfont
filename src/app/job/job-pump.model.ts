import type { Device } from '../device/device.model';

/** Matches `me.pixka.iot.d.JobPump` JSON from `/rest/iot/jobpump/*`. */
export interface JobPump {
  id: number;
  job_id: number | null;
  device_id: number | null;
  device?: Device | null;
  /** Pump port key in URL, e.g. d5 → http://ip/run?d5=1&delay=runtime */
  port: string | null;
  value: number | null;
  /** Pump run time (seconds) — delay query param */
  runtime: number | null;
  enable: boolean | null;
  sortOrder: number | null;
}

export interface JobPumpFormValue {
  deviceId: number | null;
  port: string;
  value: string | number | null;
  runtime: string | number | null;
  enable: boolean;
  sortOrder: string | number | null;
}

export interface JobPumpWritePayload {
  device_id: number | null;
  port: string | null;
  value: number | null;
  runtime: number | null;
  enable: boolean;
  sortOrder: number;
}
