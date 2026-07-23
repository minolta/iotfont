import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, of, timer } from 'rxjs';

import { ServerTimeService } from './api/server-time.service';
import { AuthService } from './auth/auth.service';
import { TranslationService } from './shared/translation.service';
import { TranslatePipe } from './shared/translate.pipe';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly serverTimeService = inject(ServerTimeService);
  private readonly authService = inject(AuthService);
  readonly translationService = inject(TranslationService);

  readonly apiTime = signal('—');
  readonly apiTimeOffline = signal(false);
  readonly apiVersion = signal('');
  readonly currentUser = this.authService.currentUser;

  private offsetMs = 0;
  private synced = false;

  constructor() {
    if (this.authService.isLoggedIn()) {
      this.authService.loadCurrentUser().subscribe();
    }

    this.syncServerTime();

    timer(60_000, 60_000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.syncServerTime());

    timer(0, 1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateClock());
  }

  logout(): void {
    this.authService.logout();
  }

  toggleLanguage(): void {
    this.translationService.toggleLanguage();
  }

  private syncServerTime(): void {
    this.serverTimeService
      .getNow()
      .pipe(
        catchError(() => {
          this.apiTimeOffline.set(true);
          this.apiTime.set('nav.offline');
          this.synced = false;
          return of(null);
        }),
      )
      .subscribe((response) => {
        if (!response?.now) {
          return;
        }
        if (response.version) {
          this.apiVersion.set(response.version);
        }
        const serverMs = new Date(response.now).getTime();
        if (Number.isNaN(serverMs)) {
          this.apiTimeOffline.set(true);
          this.apiTime.set('nav.invalidTime');
          this.synced = false;
          return;
        }
        this.offsetMs = serverMs - Date.now();
        this.apiTimeOffline.set(false);
        this.synced = true;
        this.updateClock();
      });
  }

  private updateClock(): void {
    if (!this.synced || this.apiTimeOffline()) {
      return;
    }
    this.apiTime.set(
      new Date(Date.now() + this.offsetMs).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    );
  }
}

