import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IOT_API_BASE_URL } from '../api/iot-api-base-url.token';

import type {
  JobLog,
  JobLogCountResult,
  JobLogDateSearch,
  JobLogDeleteResult,
  JobLogSearchOption,
} from './job-log.model';

@Injectable({ providedIn: 'root' })
export class JobLogService {
  private readonly http = inject(HttpClient);
  private readonly rootUrl = `${inject(IOT_API_BASE_URL)}/rest/iot/joblog`;

  getByJob(jobId: number, page = 0, limit = 50): Observable<JobLog[]> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<JobLog[]>(`${this.rootUrl}/byjob/${jobId}`, { params });
  }

  search(option: JobLogSearchOption): Observable<JobLog[]> {
    return this.http.post<JobLog[]>(`${this.rootUrl}/sn`, {
      search: option.search ?? '',
      page: option.page ?? 0,
      limit: option.limit ?? 50,
      id: option.id,
      jobId: option.jobId,
      level: option.level ?? '',
    });
  }

  getByDateRange(search: JobLogDateSearch): Observable<JobLog[]> {
    const body: JobLogDateSearch = { s: search.s, e: search.e };
    if (search.id != null && search.id > 0) {
      body.id = search.id;
    }
    return this.http.post<JobLog[]>(`${this.rootUrl}/bydate`, body);
  }

  deleteByDateRange(search: JobLogDateSearch): Observable<JobLogDeleteResult> {
    return this.http.post<JobLogDeleteResult>(`${this.rootUrl}/delete/bydate`, search);
  }

  getCount(option: JobLogSearchOption): Observable<JobLogCountResult> {
    return this.http.post<JobLogCountResult>(`${this.rootUrl}/count`, {
      search: option.search ?? '',
      jobId: option.jobId,
      id: option.id,
      level: option.level ?? '',
      s: option.s,
      e: option.e,
    });
  }
}
