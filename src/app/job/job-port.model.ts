import type { Device } from '../device/device.model';

/** Matches `me.pixka.iot.d.JobPort` JSON from `/rest/iot/jobport/*`. */
export interface JobPort {
  id: number;
  job_id: number | null;
  device_id: number | null;
  device?: Device | null;
  port: string | null;
  logic: string | null;
  value: number | null;
  runtime: number | null;
  waittime: number | null;
  enable: boolean | null;
  sortOrder: number | null;
}

export interface JobPortFormValue {
  deviceId: number | null;
  port: string;
  logic: string;
  runtime: string | number | null;
  waittime: string | number | null;
  enable: boolean;
  sortOrder: string | number | null;
}

export interface JobPortWritePayload {
  device_id: number | null;
  port: string | null;
  logic: string | null;
  value: number | null;
  runtime: number | null;
  waittime: number | null;
  enable: boolean;
  sortOrder: number;
}

export const JOB_PORT_LOGIC_OPTIONS = ['High', 'Low'] as const;
export const JOB_PORT_OPTIONS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'] as const;
