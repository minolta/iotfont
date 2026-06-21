import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IOT_API_BASE_URL } from '../api/iot-api-base-url.token';

import type { FwApp, FwRelease, FwSearchOption } from './firmware.model';

@Injectable({ providedIn: 'root' })
export class FirmwareService {
  private readonly http = inject(HttpClient);
  private readonly rootUrl = `${inject(IOT_API_BASE_URL)}/rest/iot/fw`;

  upload(appName: string, version: number, file: File): Observable<FwRelease> {
    const form = new FormData();
    form.append('afile', file);
    form.append('ver', String(version));
    form.append('appname', appName.trim());
    return this.http.post<FwRelease>(`${this.rootUrl}/upload`, form);
  }

  search(option: FwSearchOption = {}): Observable<FwRelease[]> {
    return this.http.post<FwRelease[]>(`${this.rootUrl}/sn`, {
      search: option.search ?? '',
      page: option.page ?? 0,
      limit: option.limit ?? 50,
    });
  }

  listApps(): Observable<FwApp[]> {
    return this.http.get<FwApp[]>(`${this.rootUrl}/apps`);
  }

  getLastVersion(appName: string): Observable<FwRelease> {
    const encoded = encodeURIComponent(appName.trim());
    return this.http.get<FwRelease>(`${this.rootUrl}/lastversion/${encoded}`);
  }
}
