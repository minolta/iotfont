import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IOT_API_BASE_URL } from '../api/iot-api-base-url.token';
import type { SearchOption } from '../device/device.model';

import type { JobType, JobTypeFormValue } from './job-type.model';

@Injectable({ providedIn: 'root' })
export class JobTypeService {
  private readonly http = inject(HttpClient);
  private readonly rootUrl = `${inject(IOT_API_BASE_URL)}/rest/iot/jobtype`;

  create(value: JobTypeFormValue): Observable<JobType> {
    return this.http.post<JobType>(`${this.rootUrl}/add`, this.toPayload(value));
  }

  update(id: number, value: JobTypeFormValue): Observable<JobType> {
    return this.http.post<JobType>(`${this.rootUrl}/edit`, { id, ...this.toPayload(value) });
  }

  getById(id: number): Observable<JobType> {
    return this.http.get<JobType>(`${this.rootUrl}/get/${id}`);
  }

  list(): Observable<JobType[]> {
    return this.http.get<JobType[]>(`${this.rootUrl}/list`);
  }

  search(option: SearchOption): Observable<JobType[]> {
    return this.http.post<JobType[]>(`${this.rootUrl}/sn`, {
      search: option.search ?? '',
      page: option.page ?? 0,
      limit: option.limit ?? 50,
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.rootUrl}/delete/${id}`);
  }

  private toPayload(value: JobTypeFormValue): Pick<JobType, 'name' | 'description'> {
    return {
      name: value.name.trim() || null,
      description: value.description.trim() || null,
    };
  }
}
