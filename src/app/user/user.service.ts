import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IOT_API_BASE_URL } from '../api/iot-api-base-url.token';

import type {
  AdminResetPasswordRequest,
  CreateUserRequest,
  EditUserRequest,
  User,
} from './user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly rootUrl = `${inject(IOT_API_BASE_URL)}/rest/iot/user`;

  list(): Observable<User[]> {
    return this.http.get<User[]>(`${this.rootUrl}/list`);
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.rootUrl}/get/${id}`);
  }

  create(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.rootUrl}/add`, request);
  }

  update(request: EditUserRequest): Observable<User> {
    return this.http.post<User>(`${this.rootUrl}/edit`, request);
  }

  disable(id: number): Observable<User> {
    return this.http.post<User>(`${this.rootUrl}/disable/${id}`, {});
  }

  enable(id: number): Observable<User> {
    return this.http.post<User>(`${this.rootUrl}/enable/${id}`, {});
  }

  resetPassword(request: AdminResetPasswordRequest): Observable<User> {
    return this.http.post<User>(`${this.rootUrl}/reset-password`, request);
  }
}
