import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IOT_API_BASE_URL } from '../api/iot-api-base-url.token';

import type { DeviceLiveJson } from './device-info.model';

@Injectable({ providedIn: 'root' })
export class DeviceInfoService {
  private readonly http = inject(HttpClient);
  private readonly rootUrl = `${inject(IOT_API_BASE_URL)}/rest/iot/device`;

  fetchLiveJson(deviceId: number): Observable<DeviceLiveJson> {
    return this.http.get<DeviceLiveJson>(`${this.rootUrl}/live-json/${deviceId}`);
  }

  restart(deviceId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.rootUrl}/restart/${deviceId}`, null);
  }
}
