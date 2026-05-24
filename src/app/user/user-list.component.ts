import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, finalize, map, of, switchMap } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { displayValue, formatHttpError } from '../shared/format.util';
import type { User } from './user.model';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './user-list.component.html',
  styleUrl: '../shared/crud-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly createdId = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('created'))),
    { initialValue: null as string | null },
  );

  readonly updatedId = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('updated'))),
    { initialValue: null as string | null },
  );

  readonly currentUser = this.authService.currentUser;
  readonly refreshNonce = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly togglingId = signal<number | null>(null);

  readonly users = toSignal(
    combineLatest([toObservable(this.refreshNonce)]).pipe(
      switchMap(() => {
        this.loading.set(true);
        this.error.set(null);
        return this.userService.list().pipe(
          catchError(() => {
            this.error.set('Could not load users.');
            return of([] as User[]);
          }),
          finalize(() => this.loading.set(false)),
        );
      }),
    ),
    { initialValue: [] as User[] },
  );

  readonly displayValue = displayValue;

  isSelf(user: User): boolean {
    return this.currentUser()?.id === user.id;
  }

  toggleEnabled(user: User): void {
    this.actionError.set(null);
    const action = user.enabled ? 'disable' : 'enable';
    const label = user.username;
    if (
      !window.confirm(
        user.enabled
          ? `Disable user "${label}"? They will not be able to sign in.`
          : `Enable user "${label}"?`,
      )
    ) {
      return;
    }

    this.togglingId.set(user.id);
    const request$ = user.enabled ? this.userService.disable(user.id) : this.userService.enable(user.id);
    request$
      .pipe(finalize(() => this.togglingId.set(null)))
      .subscribe({
        next: () => this.refreshNonce.update((n) => n + 1),
        error: (err: unknown) => {
          this.actionError.set(formatHttpError(err, `Could not ${action} user.`));
        },
      });
  }
}
