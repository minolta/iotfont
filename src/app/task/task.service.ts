import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IOT_API_BASE_URL } from '../api/iot-api-base-url.token';

import type { KillTaskResponse, RunningTasksResponse } from './task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly rootUrl = `${inject(IOT_API_BASE_URL)}/rest/iot/task`;

  getRunning(): Observable<RunningTasksResponse> {
    return this.http.get<RunningTasksResponse>(`${this.rootUrl}/running`);
  }

  kill(jobId: number): Observable<KillTaskResponse> {
    return this.http.post<KillTaskResponse>(`${this.rootUrl}/kill/${jobId}`, null);
  }
}
