import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { buildDeviceJsonUrl, type DeviceLiveJson } from './device-info.model';

@Injectable({ providedIn: 'root' })
export class DeviceInfoService {
  private readonly http = inject(HttpClient);

  fetchLiveJson(ip: string): Observable<DeviceLiveJson> {
    const url = buildDeviceJsonUrl(ip);
    if (!url) {
      throw new Error('Device has no IP address configured.');
    }
    return this.http.get<DeviceLiveJson>(url);
  }
}
