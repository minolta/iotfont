import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IOT_API_BASE_URL } from '../api/iot-api-base-url.token';
import type { SearchOption } from '../device/device.model';

import type { SystemConfig, SystemConfigFormValue } from './config.model';

@Injectable({ providedIn: 'root' })
export class SystemConfigService {
  private readonly http = inject(HttpClient);
  private readonly rootUrl = `${inject(IOT_API_BASE_URL)}/rest/iot/config`;

  create(value: SystemConfigFormValue): Observable<SystemConfig> {
    return this.http.post<SystemConfig>(`${this.rootUrl}/add`, this.toPayload(value));
  }

  update(id: number, value: SystemConfigFormValue): Observable<SystemConfig> {
    return this.http.post<SystemConfig>(`${this.rootUrl}/edit`, { id, ...this.toPayload(value) });
  }

  getById(id: number): Observable<SystemConfig> {
    return this.http.get<SystemConfig>(`${this.rootUrl}/get/${id}`);
  }

  list(): Observable<SystemConfig[]> {
    return this.http.get<SystemConfig[]>(`${this.rootUrl}/list`);
  }

  search(option: SearchOption): Observable<SystemConfig[]> {
    return this.http.post<SystemConfig[]>(`${this.rootUrl}/sn`, {
      search: option.search ?? '',
      page: option.page ?? 0,
      limit: option.limit ?? 50,
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.rootUrl}/delete/${id}`);
  }

  private toPayload(value: SystemConfigFormValue): Pick<SystemConfig, 'cfg_key' | 'cfg_value' | 'description'> {
    return {
      cfg_key: value.cfgKey.trim() || null,
      cfg_value: value.cfgValue.trim() || null,
      description: value.description.trim() || null,
    };
  }
}
