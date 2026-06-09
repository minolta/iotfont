import type { Device } from '../device/device.model';

/** Matches `me.pixka.iot.d.JobSensor` JSON from `/rest/iot/jobsensor/*`. */
export interface JobSensor {
  id: number;
  job_id: number | null;
  device_id: number | null;
  device?: Device | null;
  name: string | null;
  sensorType: string | null;
  readPath: string | null;
  enable: boolean | null;
  sortOrder: number | null;
}

export interface JobSensorFormValue {
  deviceId: number | null;
  name: string;
  sensorType: string;
  readPath: string;
  enable: boolean;
  sortOrder: string | number | null;
}

export interface JobSensorWritePayload {
  device_id: number | null;
  name: string | null;
  sensorType: string | null;
  readPath: string | null;
  enable: boolean;
  sortOrder: number;
}

export const JOB_SENSOR_TYPE_OPTIONS = ['humidity', 'volt', 'pressure', 'generic'] as const;
