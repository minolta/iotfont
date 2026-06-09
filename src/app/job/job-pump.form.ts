import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import type { Job } from './job.model';
import type { JobPumpFormValue } from './job-pump.model';

export function createPumpFormGroup(
  fb: FormBuilder,
  value?: Partial<JobPumpFormValue>,
  defaultDeviceId: number | null = null,
): FormGroup {
  return fb.group({
    deviceId: [value?.deviceId ?? defaultDeviceId ?? '', Validators.required],
    port: [value?.port ?? 'd5', Validators.required],
    value: [value?.value ?? '1', Validators.required],
    runtime: [value?.runtime ?? ''],
    enable: [value?.enable ?? true],
    sortOrder: [value?.sortOrder ?? ''],
  });
}

export function jobPumpsToFormValues(
  job: Pick<Job, 'pumps' | 'pump' | 'device_id' | 'device'>,
): JobPumpFormValue[] {
  if (job.pumps?.length) {
    return job.pumps.map((pump) => ({
      deviceId: pump.device_id ?? pump.device?.id ?? null,
      port: pump.port ?? 'd5',
      value: pump.value ?? 1,
      runtime: pump.runtime ?? '',
      enable: pump.enable ?? true,
      sortOrder: pump.sortOrder ?? '',
    }));
  }
  const legacyDelay = job.pump;
  const deviceId = job.device_id ?? job.device?.id ?? null;
  if (legacyDelay != null && deviceId != null) {
    return [
      {
        deviceId,
        port: 'd5',
        value: 1,
        runtime: legacyDelay,
        enable: true,
        sortOrder: '',
      },
    ];
  }
  return [];
}

export function readPumpFormValues(
  rows: Array<{
    deviceId: string | number | null;
    port: string | null;
    value: string | number | null;
    runtime: string | number | null;
    enable: boolean | null;
    sortOrder: string | number | null;
  }>,
): JobPumpFormValue[] {
  return rows.map((row) => ({
    deviceId: Number(row.deviceId),
    port: (row.port ?? 'd5').trim().toLowerCase(),
    value: row.value ?? 1,
    runtime: row.runtime ?? '',
    enable: !!row.enable,
    sortOrder: row.sortOrder ?? '',
  }));
}
