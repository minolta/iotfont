import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize, map, switchMap } from 'rxjs';

import type { Device } from './device.model';
import { DeviceService } from './device.service';

@Component({
  selector: 'app-device-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './device-edit.component.html',
  styleUrl: './device-edit.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly deviceService = inject(DeviceService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly deviceId = signal<number | null>(null);
  readonly loadedDevice = signal<Device | null>(null);

  readonly form = this.fb.group({
    name: [''],
    code: [''],
    ip: [''],
    mac: [''],
    description: [''],
    version: [''],
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((pm) => Number(pm.get('id') ?? '')),
        switchMap((id) => {
          if (!Number.isFinite(id) || id < 1) {
            this.loading.set(false);
            this.loadError.set('Invalid device ID.');
            this.deviceId.set(null);
            this.loadedDevice.set(null);
            return EMPTY;
          }
          this.deviceId.set(id);
          this.loading.set(true);
          this.loadError.set(null);
          return this.deviceService.getById(id).pipe(
            catchError(() => {
              this.loadError.set('Could not load device.');
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((device) => {
        if (!device) {
          if (!this.loadError()) {
            this.loadError.set('Device not found.');
          }
          this.loadedDevice.set(null);
          return;
        }
        this.loadError.set(null);
        this.loadedDevice.set(device);
        this.form.patchValue({
          name: device.name ?? '',
          code: device.code ?? '',
          ip: device.ip ?? '',
          mac: device.mac ?? '',
          description: device.description ?? '',
          version: device.version ?? '',
        });
      });
  }

  submit(): void {
    this.saveError.set(null);
    const id = this.deviceId();
    if (id == null) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.deviceService
      .update(id, {
        name: value.name ?? '',
        code: value.code ?? '',
        ip: value.ip ?? '',
        mac: value.mac ?? '',
        description: value.description ?? '',
        version: value.version ?? '',
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/devices'], {
            queryParams: { updated: id },
          });
        },
        error: (err: unknown) => {
          this.saveError.set(this.formatHttpError(err));
        },
      });
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
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
    return 'Could not save device.';
  }
}
