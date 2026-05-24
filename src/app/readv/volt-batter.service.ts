import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IOT_API_BASE_URL } from '../api/iot-api-base-url.token';

import type { VoltBatter, VoltBatterDateSearch } from './volt-batter.model';

@Injectable({ providedIn: 'root' })
export class VoltBatterService {
  private readonly http = inject(HttpClient);
  private readonly rootUrl = `${inject(IOT_API_BASE_URL)}/rest/iot/voltbatter`;

  getByDevice(deviceId: number, page = 0, limit = 50): Observable<VoltBatter[]> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<VoltBatter[]>(`${this.rootUrl}/bydevice/${deviceId}`, { params });
  }

  getLatestByDevice(deviceId: number): Observable<VoltBatter> {
    return this.http.get<VoltBatter>(`${this.rootUrl}/latest/${deviceId}`);
  }

  getByDateRange(search: VoltBatterDateSearch): Observable<VoltBatter[]> {
    return this.http.post<VoltBatter[]>(`${this.rootUrl}/bydate`, search);
  }
}
