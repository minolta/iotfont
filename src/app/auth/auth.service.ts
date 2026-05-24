import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';

import { IOT_API_BASE_URL } from '../api/iot-api-base-url.token';

import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from './auth-token.storage';
import type { ChangePasswordRequest, CurrentUser, LoginRequest, TokenResponse } from './auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly rootUrl = `${inject(IOT_API_BASE_URL)}/rest/iot/auth`;

  readonly currentUser = signal<CurrentUser | null>(null);

  isLoggedIn(): boolean {
    return !!getStoredAccessToken();
  }

  login(request: LoginRequest): Observable<CurrentUser> {
    return this.http.post<TokenResponse>(`${this.rootUrl}/login`, request).pipe(
      tap((response) => setStoredAccessToken(response.access_token)),
      switchMap(() => this.loadCurrentUser()),
      map((user) => user ?? { id: 0, username: request.username.trim(), role: 'USER' }),
    );
  }

  isAdmin(): boolean {
    return this.currentUser()?.role?.toUpperCase() === 'ADMIN';
  }

  loadCurrentUser(): Observable<CurrentUser | null> {
    if (!this.isLoggedIn()) {
      this.currentUser.set(null);
      return of(null);
    }
    return this.http.get<CurrentUser>(`${this.rootUrl}/me`).pipe(
      tap((user) => this.currentUser.set(user)),
      catchError(() => {
        this.logout(false);
        return of(null);
      }),
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.rootUrl}/change-password`, request);
  }

  logout(navigate = true): void {
    clearStoredAccessToken();
    this.currentUser.set(null);
    if (navigate) {
      void this.router.navigate(['/login']);
    }
  }
}
