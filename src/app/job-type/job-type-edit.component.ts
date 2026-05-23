import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize, map, switchMap } from 'rxjs';

import { formatHttpError } from '../shared/format.util';
import type { JobType } from './job-type.model';
import { JobTypeService } from './job-type.service';

@Component({
  selector: 'app-job-type-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './job-type-edit.component.html',
  styleUrl: '../shared/crud-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobTypeEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobTypeService = inject(JobTypeService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly jobTypeId = signal<number | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    description: [''],
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((pm) => Number(pm.get('id') ?? '')),
        switchMap((id) => {
          if (!Number.isFinite(id) || id < 1) {
            this.loading.set(false);
            this.loadError.set('Invalid job type ID.');
            this.jobTypeId.set(null);
            return EMPTY;
          }
          this.jobTypeId.set(id);
          this.loading.set(true);
          this.loadError.set(null);
          return this.jobTypeService.getById(id).pipe(
            catchError(() => {
              this.loadError.set('Could not load job type.');
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((jobType: JobType | undefined) => {
        if (!jobType) {
          if (!this.loadError()) {
            this.loadError.set('Job type not found.');
          }
          return;
        }
        this.form.patchValue({
          name: jobType.name ?? '',
          description: jobType.description ?? '',
        });
      });
  }

  submit(): void {
    this.saveError.set(null);
    const id = this.jobTypeId();
    if (id == null || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.jobTypeService
      .update(id, {
        name: value.name ?? '',
        description: value.description ?? '',
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/job-types'], {
            queryParams: { updated: id },
          });
        },
        error: (err: unknown) => {
          this.saveError.set(formatHttpError(err, 'Could not save job type.'));
        },
      });
  }
}
