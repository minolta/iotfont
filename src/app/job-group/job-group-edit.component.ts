import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize, map, switchMap } from 'rxjs';

import { formatHttpError } from '../shared/format.util';
import type { JobGroup } from './job-group.model';
import { JobGroupService } from './job-group.service';

@Component({
  selector: 'app-job-group-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './job-group-edit.component.html',
  styleUrl: '../shared/crud-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobGroupEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobGroupService = inject(JobGroupService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly jobGroupId = signal<number | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((pm) => Number(pm.get('id') ?? '')),
        switchMap((id) => {
          if (!Number.isFinite(id) || id < 1) {
            this.loading.set(false);
            this.loadError.set('Invalid job group ID.');
            this.jobGroupId.set(null);
            return EMPTY;
          }
          this.jobGroupId.set(id);
          this.loading.set(true);
          this.loadError.set(null);
          return this.jobGroupService.getById(id).pipe(
            catchError(() => {
              this.loadError.set('Could not load job group.');
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((jobGroup: JobGroup | undefined) => {
        if (!jobGroup) {
          if (!this.loadError()) {
            this.loadError.set('Job group not found.');
          }
          return;
        }
        this.form.patchValue({ name: jobGroup.name ?? '' });
      });
  }

  submit(): void {
    this.saveError.set(null);
    const id = this.jobGroupId();
    if (id == null || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.jobGroupService
      .update(id, { name: value.name ?? '' })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/job-groups'], {
            queryParams: { updated: id },
          });
        },
        error: (err: unknown) => {
          this.saveError.set(formatHttpError(err, 'Could not save job group.'));
        },
      });
  }
}
