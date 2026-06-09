import { toDatetimeLocalValue, toTimeInputValue } from '../shared/format.util';

import type { Job, JobFormValue } from './job.model';
import { jobPortsToFormValues } from './job-port.form';
import { jobPumpsToFormValues } from './job-pump.form';
import { jobSensorsToFormValues } from './job-sensor.form';

export function jobToFormValue(job: Job, overrides: Partial<JobFormValue> = {}): JobFormValue {
  const baseName = job.name?.trim() || `Job #${job.id}`;
  return {
    name: `${baseName} (copy)`,
    description: job.description ?? '',
    deviceId: job.device_id ?? job.device?.id ?? null,
    jobtypeId: job.jobtype_id ?? job.jobtype?.id ?? null,
    jobGroupId: job.jobgroup_id ?? job.jobgroup?.id ?? null,
    enable: false,
    enableLogs: job.enable_logs ?? false,
    runtime: job.runtime != null ? job.runtime : '',
    waittime: job.waittime != null ? job.waittime : '',
    sdate: toDatetimeLocalValue(job.sdate),
    edate: toDatetimeLocalValue(job.edate),
    stimes: toTimeInputValue(job.stimes),
    etimes: toTimeInputValue(job.etimes),
    hlow: job.hlow != null ? job.hlow : '',
    hhigh: job.hhigh != null ? job.hhigh : '',
    tlow: job.tlow != null ? job.tlow : '',
    thigh: job.thigh != null ? job.thigh : '',
    priority: job.priority != null ? job.priority : '0',
    ports: jobPortsToFormValues(job.ports),
    pumps: jobPumpsToFormValues(job),
    sensors: jobSensorsToFormValues(job.sensors),
    ...overrides,
  };
}
