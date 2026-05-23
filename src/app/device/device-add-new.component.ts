import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { DeviceService } from './device.service';

@Component({
  selector: 'app-device-add-new',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './device-add-new.component.html',
  styleUrl: './device-add-new.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceAddNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly deviceService = inject(DeviceService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name: [''],
    code: [''],
    ip: [''],
    mac: [''],
    description: [''],
    version: [''],
  });

  submit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.deviceService
      .create({
        name: value.name ?? '',
        code: value.code ?? '',
        ip: value.ip ?? '',
        mac: value.mac ?? '',
        description: value.description ?? '',
        version: value.version ?? '',
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (created) => {
          void this.router.navigate(['/devices'], {
            queryParams: { created: created.id },
          });
        },
        error: (err: unknown) => {
          this.errorMessage.set(this.formatHttpError(err));
        },
      });
  }

  private formatHttpError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (typeof body === 'object' && body !== null && 'message' in body) {
        const message = (body as { message?: unknown }).message;
        if (typeof message === 'string') {
          return message;
        }
      }
      if (typeof err.error === 'string' && err.error.length > 0) {
        return err.error;
      }
      return err.message || `Request failed (${err.status}).`;
    }
    return 'Could not create device.';
  }
}
