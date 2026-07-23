import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize, map, switchMap } from 'rxjs';

import { formatHttpError } from '../shared/format.util';
import type { SystemConfig } from './config.model';
import { SystemConfigService } from './config.service';

@Component({
  selector: 'app-config-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './config-edit.component.html',
  styleUrl: '../shared/crud-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly configService = inject(SystemConfigService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly configId = signal<number | null>(null);

  readonly form = this.fb.group({
    cfgKey: ['', [Validators.required, Validators.pattern(/\S/)]],
    cfgValue: ['', [Validators.required]],
    description: [''],
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((pm) => Number(pm.get('id') ?? '')),
        switchMap((id) => {
          if (!Number.isFinite(id) || id < 1) {
            this.loading.set(false);
            this.loadError.set('Invalid configuration ID.');
            this.configId.set(null);
            return EMPTY;
          }
          this.configId.set(id);
          this.loading.set(true);
          this.loadError.set(null);
          return this.configService.getById(id).pipe(
            catchError(() => {
              this.loadError.set('Could not load configuration.');
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((config: SystemConfig | undefined) => {
        if (!config) {
          if (!this.loadError()) {
            this.loadError.set('Configuration not found.');
          }
          return;
        }
        this.form.patchValue({
          cfgKey: config.cfg_key ?? '',
          cfgValue: config.cfg_value ?? '',
          description: config.description ?? '',
        });
      });
  }

  submit(): void {
    this.saveError.set(null);
    const id = this.configId();
    if (id == null || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.configService
      .update(id, {
        cfgKey: value.cfgKey ?? '',
        cfgValue: value.cfgValue ?? '',
        description: value.description ?? '',
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/configs'], {
            queryParams: { updated: id },
          });
        },
        error: (err: unknown) => {
          this.saveError.set(formatHttpError(err, 'Could not save configuration.'));
        },
      });
  }
}
