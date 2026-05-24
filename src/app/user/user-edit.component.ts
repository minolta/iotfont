import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize, map, switchMap } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { formatHttpError } from '../shared/format.util';
import { USER_ROLES, type User, type UserRole } from './user.model';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly resettingPassword = signal(false);
  readonly passwordError = signal<string | null>(null);
  readonly passwordSuccess = signal<string | null>(null);
  readonly userId = signal<number | null>(null);
  readonly user = signal<User | null>(null);
  readonly roles = USER_ROLES;
  readonly currentUser = this.authService.currentUser;

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    role: ['USER' as UserRole, Validators.required],
    enabled: [true],
  });

  readonly passwordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(5)]],
    confirmPassword: ['', Validators.required],
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((pm) => Number(pm.get('id') ?? '')),
        switchMap((id) => {
          if (!Number.isFinite(id) || id < 1) {
            this.loading.set(false);
            this.loadError.set('Invalid user ID.');
            this.userId.set(null);
            return EMPTY;
          }
          this.userId.set(id);
          this.loading.set(true);
          this.loadError.set(null);
          return this.userService.getById(id).pipe(
            catchError(() => {
              this.loadError.set('Could not load user.');
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((loadedUser: User | undefined) => {
        if (!loadedUser) {
          if (!this.loadError()) {
            this.loadError.set('User not found.');
          }
          return;
        }
        this.user.set(loadedUser);
        this.form.patchValue({
          username: loadedUser.username,
          role: loadedUser.role,
          enabled: loadedUser.enabled,
        });
        if (this.isSelf()) {
          this.form.controls.role.disable();
          this.form.controls.enabled.disable();
        }
      });
  }

  isSelf(): boolean {
    const id = this.userId();
    return id != null && this.currentUser()?.id === id;
  }

  submit(): void {
    this.saveError.set(null);
    const id = this.userId();
    if (id == null || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.userService
      .update({
        id,
        username: value.username ?? '',
        role: value.role ?? 'USER',
        enabled: value.enabled ?? true,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/users'], {
            queryParams: { updated: id },
          });
        },
        error: (err: unknown) => {
          this.saveError.set(formatHttpError(err, 'Could not save user.'));
        },
      });
  }

  resetPassword(): void {
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
    const id = this.userId();
    if (id == null || this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const value = this.passwordForm.getRawValue();
    const newPassword = value.newPassword ?? '';
    const confirmPassword = value.confirmPassword ?? '';
    if (newPassword !== confirmPassword) {
      this.passwordError.set('New password and confirmation do not match.');
      return;
    }

    this.resettingPassword.set(true);
    this.userService
      .resetPassword({ id, newPassword })
      .pipe(finalize(() => this.resettingPassword.set(false)))
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.passwordSuccess.set('Password updated.');
        },
        error: (err: unknown) => {
          this.passwordError.set(formatHttpError(err, 'Could not reset password.'));
        },
      });
  }
}
