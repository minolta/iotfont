import type { Device } from '../device/device.model';
import type { JobGroup } from '../job-group/job-group.model';
import type { JobType } from '../job-type/job-type.model';
import type { JobPort, JobPortFormValue } from './job-port.model';
import type { JobSensor, JobSensorFormValue } from './job-sensor.model';

/** Matches `me.pixka.iot.d.Job` JSON from `/rest/iot/job/*`. */
export interface Job {
  id: number;
  name: string | null;
  description: string | null;
  device_id: number | null;
  device?: Device | null;
  jobtype_id: number | null;
  jobtype?: JobType | null;
  jobgroup_id: number | null;
  jobgroup?: JobGroup | null;
  enable: boolean | null;
  runtime: number | null;
  waittime: number | null;
  sdate: string | null;
  edate: string | null;
  stimes: string | null;
  etimes: string | null;
  /** Minimum humidity (%) to trigger GPIO ports — used by HumidityJobWorker */
  hlow: number | null;
  /** Maximum humidity (%) to trigger GPIO ports — used by HumidityJobWorker */
  hhigh: number | null;
  /** Minimum temperature (°C) to trigger GPIO ports */
  tlow: number | null;
  /** Maximum temperature (°C) to trigger GPIO ports */
  thigh: number | null;
  priority: number | null;
  ports?: JobPort[] | null;
  sensors?: JobSensor[] | null;
}

export interface JobFormValue {
  name: string;
  description: string;
  deviceId: number | null;
  jobtypeId: number | null;
  jobGroupId: number | null;
  enable: boolean;
  runtime: string | number | null;
  waittime: string | number | null;
  sdate: string;
  edate: string;
  stimes: string;
  etimes: string;
  hlow: string | number | null;
  hhigh: string | number | null;
  tlow: string | number | null;
  thigh: string | number | null;
  priority: string | number | null;
  ports: JobPortFormValue[];
  sensors: JobSensorFormValue[];
}

/** Job type names that use HumidityJobWorker on the backend. */
export const HUMIDITY_JOB_TYPE_NAMES = ['humidity', 'runhbyd1', 'readhumidity'] as const;

/** Job type names that use temperature range checks on the backend. */
export const TEMPERATURE_JOB_TYPE_NAMES = ['readht', 'readh/t', 'temperature'] as const;
