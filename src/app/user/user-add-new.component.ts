import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { formatHttpError } from '../shared/format.util';
import { USER_ROLES, type UserRole } from './user.model';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-add-new',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-add-new.component.html',
  styleUrl: '../shared/crud-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAddNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly roles = USER_ROLES;

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required, Validators.minLength(5)]],
    confirmPassword: ['', Validators.required],
    role: ['USER' as UserRole, Validators.required],
  });

  submit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const password = value.password ?? '';
    const confirmPassword = value.confirmPassword ?? '';
    if (password !== confirmPassword) {
      this.errorMessage.set('Password and confirmation do not match.');
      return;
    }

    this.submitting.set(true);
    this.userService
      .create({
        username: value.username ?? '',
        password,
        role: value.role ?? 'USER',
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (created) => {
          void this.router.navigate(['/users'], {
            queryParams: { created: created.id },
          });
        },
        error: (err: unknown) => {
          this.errorMessage.set(formatHttpError(err, 'Could not create user.'));
        },
      });
  }
}
