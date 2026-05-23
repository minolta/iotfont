import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import type { JobSensor, JobSensorFormValue } from './job-sensor.model';

export function createSensorFormGroup(
  fb: FormBuilder,
  value?: Partial<JobSensorFormValue>,
  defaultDeviceId: number | null = null,
): FormGroup {
  return fb.group({
    deviceId: [value?.deviceId ?? defaultDeviceId ?? '', Validators.required],
    name: [value?.name ?? ''],
    sensorType: [value?.sensorType ?? 'humidity', Validators.required],
    readPath: [value?.readPath ?? '/'],
    enable: [value?.enable ?? true],
    sortOrder: [value?.sortOrder ?? ''],
  });
}

export function jobSensorsToFormValues(sensors: JobSensor[] | null | undefined): JobSensorFormValue[] {
  return (sensors ?? []).map((sensor) => ({
    deviceId: sensor.device_id ?? sensor.device?.id ?? null,
    name: sensor.name ?? '',
    sensorType: sensor.sensorType ?? 'humidity',
    readPath: sensor.readPath ?? '/',
    enable: sensor.enable ?? true,
    sortOrder: sensor.sortOrder ?? '',
  }));
}

export function readSensorFormValues(
  rows: Array<{
    deviceId: string | number | null;
    name: string | null;
    sensorType: string | null;
    readPath: string | null;
    enable: boolean | null;
    sortOrder: string | number | null;
  }>,
): JobSensorFormValue[] {
  return rows.map((row) => ({
    deviceId: Number(row.deviceId),
    name: row.name ?? '',
    sensorType: row.sensorType ?? 'humidity',
    readPath: row.readPath ?? '/',
    enable: !!row.enable,
    sortOrder: row.sortOrder ?? '',
  }));
}
