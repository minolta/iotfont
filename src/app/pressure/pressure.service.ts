import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IOT_API_BASE_URL } from '../api/iot-api-base-url.token';
import type { Pressure, PressureDateSearch } from './pressure.model';

@Injectable({ providedIn: 'root' })
export class PressureService {
  private readonly http = inject(HttpClient);
  private readonly rootUrl = `${inject(IOT_API_BASE_URL)}/rest/iot/pressure`;

  getByDevice(deviceId: number, page = 0, limit = 50): Observable<Pressure[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);
    return this.http.get<Pressure[]>(`${this.rootUrl}/bydevice/${deviceId}`, { params });
  }

  getLatestByDevice(deviceId: number): Observable<Pressure> {
    return this.http.get<Pressure>(`${this.rootUrl}/latest/${deviceId}`);
  }

  getByDateRange(search: PressureDateSearch): Observable<Pressure[]> {
    return this.http.post<Pressure[]>(`${this.rootUrl}/bydate`, search);
  }

  add(reading: Pressure): Observable<Pressure> {
    return this.http.post<Pressure>(`${this.rootUrl}/add`, reading);
  }
}
