import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import type { JobPort, JobPortFormValue } from './job-port.model';

export function createPortFormGroup(
  fb: FormBuilder,
  value?: Partial<JobPortFormValue>,
  defaultDeviceId: number | null = null,
): FormGroup {
  return fb.group({
    deviceId: [value?.deviceId ?? defaultDeviceId ?? '', Validators.required],
    port: [value?.port ?? '', Validators.required],
    logic: [value?.logic ?? 'High', Validators.required],
    runtime: [value?.runtime ?? ''],
    waittime: [value?.waittime ?? ''],
    enable: [value?.enable ?? true],
    sortOrder: [value?.sortOrder ?? ''],
  });
}

export function jobPortsToFormValues(ports: JobPort[] | null | undefined): JobPortFormValue[] {
  return (ports ?? []).map((port) => ({
    deviceId: port.device_id ?? port.device?.id ?? null,
    port: port.port ?? '',
    logic: port.logic ?? 'High',
    runtime: port.runtime ?? '',
    waittime: port.waittime ?? '',
    enable: port.enable ?? true,
    sortOrder: port.sortOrder ?? '',
  }));
}

export function readPortFormValues(
  rows: Array<{
    deviceId: string | number | null;
    port: string | null;
    logic: string | null;
    runtime: string | number | null;
    waittime: string | number | null;
    enable: boolean | null;
    sortOrder: string | number | null;
  }>,
): JobPortFormValue[] {
  return rows.map((row) => ({
    deviceId: Number(row.deviceId),
    port: row.port ?? '',
    logic: row.logic ?? 'High',
    runtime: row.runtime ?? '',
    waittime: row.waittime ?? '',
    enable: !!row.enable,
    sortOrder: row.sortOrder ?? '',
  }));
}
