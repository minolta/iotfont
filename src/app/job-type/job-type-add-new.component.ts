import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { formatHttpError } from '../shared/format.util';
import { JobTypeService } from './job-type.service';

@Component({
  selector: 'app-job-type-add-new',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './job-type-add-new.component.html',
  styleUrl: '../shared/crud-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobTypeAddNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly jobTypeService = inject(JobTypeService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    description: [''],
  });

  submit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.jobTypeService
      .create({
        name: value.name ?? '',
        description: value.description ?? '',
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (created) => {
          void this.router.navigate(['/job-types'], {
            queryParams: { created: created.id },
          });
        },
        error: (err: unknown) => {
          this.errorMessage.set(formatHttpError(err, 'Could not create job type.'));
        },
      });
  }
}
