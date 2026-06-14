import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IOT_API_BASE_URL } from '../api/iot-api-base-url.token';

import type { DirectRunResponse, KillTaskResponse, RunningTasksResponse } from './task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly rootUrl = `${inject(IOT_API_BASE_URL)}/rest/iot/task`;

  getRunning(jobType?: string): Observable<RunningTasksResponse> {
    let params = new HttpParams();
    const trimmed = jobType?.trim();
    if (trimmed) {
      params = params.set('jobType', trimmed);
    }
    return this.http.get<RunningTasksResponse>(`${this.rootUrl}/running`, { params });
  }

  kill(jobId: number): Observable<KillTaskResponse> {
    return this.http.post<KillTaskResponse>(`${this.rootUrl}/kill/${jobId}`, null);
  }

  directRun(jobId: number): Observable<DirectRunResponse> {
    return this.http.post<DirectRunResponse>(`${this.rootUrl}/directrun/${jobId}`, null);
  }
}
