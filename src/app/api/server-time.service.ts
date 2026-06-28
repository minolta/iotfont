import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IOT_API_BASE_URL } from '../api/iot-api-base-url.token';

/** Matches `me.pixka.iot.o.ServerTimeResponse`. */
export interface ServerTimeResponse {
  now: string;
  version: string;
}

@Injectable({ providedIn: 'root' })
export class ServerTimeService {
  private readonly http = inject(HttpClient);
  private readonly rootUrl = `${inject(IOT_API_BASE_URL)}/rest/iot/time`;

  getNow(): Observable<ServerTimeResponse> {
    return this.http.get<ServerTimeResponse>(`${this.rootUrl}/now`);
  }
}
