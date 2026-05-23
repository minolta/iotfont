import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, of, switchMap } from 'rxjs';

import { IOT_API_BASE_URL } from '../api/iot-api-base-url.token';
import type { SearchOption } from '../device/device.model';

import { jobToFormValue } from './job.form';
import type { JobImportPayload, JobImportResult } from './job-import.model';
import type { Job, JobFormValue } from './job.model';
import type { JobPortFormValue, JobPortWritePayload } from './job-port.model';
import type { JobSensorFormValue, JobSensorWritePayload } from './job-sensor.model';

@Injectable({ providedIn: 'root' })
export class JobService {
  private readonly http = inject(HttpClient);
  private readonly rootUrl = `${inject(IOT_API_BASE_URL)}/rest/iot/job`;

  create(value: JobFormValue): Observable<Job> {
    return this.http.post<Job>(`${this.rootUrl}/add`, this.toPayload(value));
  }

  update(id: number, value: JobFormValue): Observable<Job> {
    return this.http.post<Job>(`${this.rootUrl}/edit`, { id, ...this.toPayload(value) });
  }

  getById(id: number): Observable<Job> {
    return this.http.get<Job>(`${this.rootUrl}/get/${id}`);
  }

  list(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.rootUrl}/list`);
  }

  search(option: SearchOption): Observable<Job[]> {
    return this.http.post<Job[]>(`${this.rootUrl}/sn`, {
      search: option.search ?? '',
      page: option.page ?? 0,
      limit: option.limit ?? 50,
    });
  }

  getByDevice(deviceId: number, page = 0, limit = 50): Observable<Job[]> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<Job[]>(`${this.rootUrl}/bydevice/${deviceId}`, { params });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.rootUrl}/delete/${id}`);
  }

  clone(id: number): Observable<Job> {
    return this.getById(id).pipe(
      switchMap((job) => this.create(jobToFormValue(job, { enable: false }))),
    );
  }

  import(jobs: JobImportPayload, updateExisting = true): Observable<JobImportResult> {
    const params = new HttpParams().set('updateExisting', updateExisting);
    return this.http.post<JobImportResult>(`${this.rootUrl}/import`, jobs, { params });
  }

  listForExport(options: { search?: string; deviceId?: number | null } = {}): Observable<Job[]> {
    const trimmed = options.search?.trim() ?? '';
    const deviceId = options.deviceId;
    const request$ =
      deviceId != null && Number.isFinite(deviceId) && deviceId > 0
        ? this.getByDevice(deviceId, 0, 1000)
        : trimmed
          ? this.search({ search: trimmed, page: 0, limit: 1000 })
          : this.list();

    return request$.pipe(
      switchMap((jobs) => {
        if (jobs.length === 0) {
          return of([] as Job[]);
        }
        return forkJoin(
          jobs.map((job) =>
            this.getById(job.id).pipe(catchError(() => of(job))),
          ),
        );
      }),
    );
  }

  private toPayload(value: JobFormValue): Omit<Job, 'id' | 'device' | 'jobtype' | 'ports' | 'sensors'> & {
    ports: JobPortWritePayload[];
    sensors: JobSensorWritePayload[];
  } {
    return {
      name: value.name.trim() || null,
      description: value.description.trim() || null,
      device_id: value.deviceId,
      jobtype_id: value.jobtypeId,
      jobgroup_id: this.toNullableLong(value.jobGroupId),
      enable: value.enable,
      runtime: this.toNullableLong(value.runtime),
      waittime: this.toNullableLong(value.waittime),
      sdate: this.toApiDate(value.sdate),
      edate: this.toApiDate(value.edate),
      stimes: this.toNullableString(value.stimes),
      etimes: this.toNullableString(value.etimes),
      hlow: this.toNullableDecimal(value.hlow),
      hhigh: this.toNullableDecimal(value.hhigh),
      tlow: this.toNullableDecimal(value.tlow),
      thigh: this.toNullableDecimal(value.thigh),
      priority: this.toNullableInt(value.priority) ?? 0,
      ports: value.ports.map((port, index) => this.toPortPayload(port, index)),
      sensors: value.sensors.map((sensor, index) => this.toSensorPayload(sensor, index)),
    };
  }

  private toPortPayload(port: JobPortFormValue, index: number): JobPortWritePayload {
    return {
      device_id: port.deviceId,
      port: port.port.trim().toUpperCase() || null,
      logic: port.logic.trim() || null,
      value: null,
      runtime: this.toNullableLong(port.runtime),
      waittime: this.toNullableLong(port.waittime),
      enable: port.enable,
      sortOrder: this.toNullableInt(port.sortOrder) ?? index,
    };
  }

  private toSensorPayload(sensor: JobSensorFormValue, index: number): JobSensorWritePayload {
    const readPath = (sensor.readPath ?? '').trim() || '/';
    return {
      device_id: sensor.deviceId,
      name: sensor.name.trim() || null,
      sensorType: (sensor.sensorType ?? 'humidity').trim().toLowerCase() || 'humidity',
      readPath: readPath.startsWith('/') ? readPath : `/${readPath}`,
      enable: sensor.enable,
      sortOrder: this.toNullableInt(sensor.sortOrder) ?? index,
    };
  }

  private toNullableLong(value: string | number | null | undefined): number | null {
    if (value == null || value === '') {
      return null;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? Math.trunc(value) : null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const num = Number(trimmed);
    return Number.isFinite(num) ? Math.trunc(num) : null;
  }

  private toNullableDecimal(value: string | number | null | undefined): number | null {
    if (value == null || value === '') {
      return null;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : null;
  }

  private toNullableInt(value: string | number | null | undefined): number | null {
    if (value == null || value === '') {
      return null;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? Math.trunc(value) : null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const num = Number(trimmed);
    return Number.isFinite(num) ? Math.trunc(num) : null;
  }

  private toNullableString(value: string | number | null | undefined): string | null {
    if (value == null) {
      return null;
    }
    const trimmed = String(value).trim();
    return trimmed || null;
  }

  private toApiDate(localValue: string | null | undefined): string | null {
    const trimmed = (localValue ?? '').trim();
    if (!trimmed) {
      return null;
    }
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  }
}
