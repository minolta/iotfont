import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IOT_API_BASE_URL } from '../api/iot-api-base-url.token';

import type { Device, DeviceFormValue, SearchOption } from './device.model';
import type { DeviceImportPayload, DeviceImportResult } from './device-import.model';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly http = inject(HttpClient);
  private readonly rootUrl = `${inject(IOT_API_BASE_URL)}/rest/iot/device`;

  create(value: DeviceFormValue): Observable<Device> {
    return this.http.post<Device>(`${this.rootUrl}/add`, this.toPayload(value));
  }

  update(id: number, value: DeviceFormValue): Observable<Device> {
    return this.http.post<Device>(`${this.rootUrl}/edit`, { id, ...this.toPayload(value) });
  }

  getById(id: number): Observable<Device> {
    return this.http.get<Device>(`${this.rootUrl}/get/${id}`);
  }

  list(): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.rootUrl}/list`);
  }

  search(option: SearchOption): Observable<Device[]> {
    return this.http.post<Device[]>(`${this.rootUrl}/sn`, {
      search: option.search ?? '',
      page: option.page ?? 0,
      limit: option.limit ?? 50,
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.rootUrl}/delete/${id}`);
  }

  import(devices: DeviceImportPayload, updateExisting = true): Observable<DeviceImportResult> {
    const params = new HttpParams().set('updateExisting', updateExisting);
    return this.http.post<DeviceImportResult>(`${this.rootUrl}/import`, devices, { params });
  }

  listForExport(search?: string): Observable<Device[]> {
    const trimmed = search?.trim() ?? '';
    return trimmed
      ? this.search({ search: trimmed, page: 0, limit: 1000 })
      : this.list();
  }

  private toPayload(value: DeviceFormValue): Omit<Device, 'id' | 'lastupdate' | 'lastcheckin' | 'lastuptime'> {
    return {
      name: value.name.trim() || null,
      code: value.code.trim() || null,
      ip: value.ip.trim() || null,
      mac: value.mac.trim() || null,
      description: value.description.trim() || null,
      version: value.version.trim() || null,
    };
  }
}
