import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IOT_API_BASE_URL } from '../api/iot-api-base-url.token';
import type { SearchOption } from '../device/device.model';

import type { JobGroup, JobGroupFormValue } from './job-group.model';

@Injectable({ providedIn: 'root' })
export class JobGroupService {
  private readonly http = inject(HttpClient);
  private readonly rootUrl = `${inject(IOT_API_BASE_URL)}/rest/iot/jobgroup`;

  create(value: JobGroupFormValue): Observable<JobGroup> {
    return this.http.post<JobGroup>(`${this.rootUrl}/add`, this.toPayload(value));
  }

  update(id: number, value: JobGroupFormValue): Observable<JobGroup> {
    return this.http.post<JobGroup>(`${this.rootUrl}/edit`, { id, ...this.toPayload(value) });
  }

  getById(id: number): Observable<JobGroup> {
    return this.http.get<JobGroup>(`${this.rootUrl}/get/${id}`);
  }

  list(): Observable<JobGroup[]> {
    return this.http.get<JobGroup[]>(`${this.rootUrl}/list`);
  }

  search(option: SearchOption): Observable<JobGroup[]> {
    return this.http.post<JobGroup[]>(`${this.rootUrl}/sn`, {
      search: option.search ?? '',
      page: option.page ?? 0,
      limit: option.limit ?? 50,
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.rootUrl}/delete/${id}`);
  }

  private toPayload(value: JobGroupFormValue): Pick<JobGroup, 'name'> {
    return {
      name: value.name.trim() || null,
    };
  }
}
