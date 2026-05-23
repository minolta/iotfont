import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { formatHttpError } from '../shared/format.util';
import type { JobExportRecord } from './job-export.util';
import type { JobImportResult } from './job-import.model';
import { JobService } from './job.service';

@Component({
  selector: 'app-job-import',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './job-import.component.html',
  styleUrl: './job-import.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobImportComponent {
  private readonly jobService = inject(JobService);

  readonly jsonText = signal('');
  readonly updateExisting = signal(true);
  readonly submitting = signal(false);
  readonly parseError = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly result = signal<JobImportResult | null>(null);

  onJsonInput(value: string): void {
    this.jsonText.set(value);
    this.parseError.set(null);
    this.errorMessage.set(null);
  }

  onUpdateExistingChange(checked: boolean): void {
    this.updateExisting.set(checked);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.jsonText.set(typeof reader.result === 'string' ? reader.result : '');
      this.parseError.set(null);
      this.errorMessage.set(null);
      input.value = '';
    };
    reader.onerror = () => {
      this.parseError.set('Could not read the selected file.');
      input.value = '';
    };
    reader.readAsText(file);
  }

  submit(): void {
    this.parseError.set(null);
    this.errorMessage.set(null);
    this.result.set(null);

    const trimmed = this.jsonText().trim();
    if (!trimmed) {
      this.parseError.set('Paste or upload a JSON array of jobs.');
      return;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(trimmed);
    } catch {
      this.parseError.set('Invalid JSON. Expected an array of job objects.');
      return;
    }

    if (!Array.isArray(payload)) {
      this.parseError.set('JSON must be an array of job objects.');
      return;
    }

    if (payload.length === 0) {
      this.parseError.set('The array is empty. Add at least one job record.');
      return;
    }

    this.submitting.set(true);
    this.jobService
      .import(payload as JobExportRecord[], this.updateExisting())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (importResult) => {
          this.result.set(importResult);
        },
        error: (err: unknown) => {
          this.errorMessage.set(this.formatImportError(err));
        },
      });
  }

  private formatImportError(err: unknown): string {
    return formatHttpError(err, 'Could not import jobs.');
  }
}
