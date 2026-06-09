import type { JobPortWritePayload } from './job-port.model';
import type { JobPumpWritePayload } from './job-pump.model';
import type { JobSensorWritePayload } from './job-sensor.model';
import type { Job } from './job.model';

/** JSON record for job backup/import (matches create/update payload shape). */
export interface JobExportRecord {
  name: string | null;
  description: string | null;
  device_id: number | null;
  jobtype_id: number | null;
  jobgroup_id: number | null;
  enable: boolean;
  enable_logs: boolean;
  runtime: number | null;
  waittime: number | null;
  sdate: string | null;
  edate: string | null;
  stimes: string | null;
  etimes: string | null;
  hlow: number | null;
  hhigh: number | null;
  pump: number | null;
  tlow: number | null;
  thigh: number | null;
  priority: number;
  ports: JobPortWritePayload[];
  pumps: JobPumpWritePayload[];
  sensors: JobSensorWritePayload[];
}
export type JobExportPayload = JobExportRecord[];

export function jobToExportRecord(job: Job): JobExportRecord {
  return {
    name: job.name,
    description: job.description,
    device_id: job.device_id ?? job.device?.id ?? null,
    jobtype_id: job.jobtype_id ?? job.jobtype?.id ?? null,
    jobgroup_id: job.jobgroup_id ?? job.jobgroup?.id ?? null,
    enable: job.enable ?? true,
    enable_logs: job.enable_logs ?? false,
    runtime: job.runtime,
    waittime: job.waittime,
    sdate: job.sdate,
    edate: job.edate,
    stimes: job.stimes,
    etimes: job.etimes,
    hlow: job.hlow,
    hhigh: job.hhigh,
    pump: job.pump,
    tlow: job.tlow,
    thigh: job.thigh,
    priority: job.priority ?? 0,
    ports: (job.ports ?? []).map(
      (port): JobPortWritePayload => ({
        device_id: port.device_id ?? port.device?.id ?? null,
        port: port.port,
        logic: port.logic,
        value: port.value,
        runtime: port.runtime,
        waittime: port.waittime,
        enable: port.enable ?? true,
        sortOrder: port.sortOrder ?? 0,
      }),
    ),
    pumps: (job.pumps ?? []).map(
      (pump): JobPumpWritePayload => ({
        device_id: pump.device_id ?? pump.device?.id ?? null,
        port: pump.port,
        value: pump.value,
        runtime: pump.runtime,
        enable: pump.enable ?? true,
        sortOrder: pump.sortOrder ?? 0,
      }),
    ),
    sensors: (job.sensors ?? []).map(
      (sensor): JobSensorWritePayload => ({
        device_id: sensor.device_id ?? sensor.device?.id ?? null,
        name: sensor.name,
        sensorType: sensor.sensorType,
        readPath: sensor.readPath,
        enable: sensor.enable ?? true,
        sortOrder: sensor.sortOrder ?? 0,
      }),
    ),
  };
}

export function jobsToExportPayload(jobs: Job[]): JobExportPayload {
  return jobs.map(jobToExportRecord);
}
