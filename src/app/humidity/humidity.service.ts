import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IOT_API_BASE_URL } from '../api/iot-api-base-url.token';

import type { Humidity, HumidityDateSearch } from './humidity.model';

@Injectable({ providedIn: 'root' })
export class HumidityService {
  private readonly http = inject(HttpClient);
  private readonly rootUrl = `${inject(IOT_API_BASE_URL)}/rest/iot/humidity`;

  getByDevice(deviceId: number, page = 0, limit = 50): Observable<Humidity[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);
    return this.http.get<Humidity[]>(`${this.rootUrl}/bydevice/${deviceId}`, { params });
  }

  getLatestByDevice(deviceId: number): Observable<Humidity> {
    return this.http.get<Humidity>(`${this.rootUrl}/latest/${deviceId}`);
  }

  getByDateRange(search: HumidityDateSearch): Observable<Humidity[]> {
    return this.http.post<Humidity[]>(`${this.rootUrl}/bydate`, search);
  }
}
