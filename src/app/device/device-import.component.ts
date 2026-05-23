import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { formatHttpError } from '../shared/format.util';
import type { DeviceImportResult } from './device-import.model';
import { DeviceService } from './device.service';

@Component({
  selector: 'app-device-import',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './device-import.component.html',
  styleUrl: './device-import.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceImportComponent {
  private readonly deviceService = inject(DeviceService);

  readonly jsonText = signal('');
  readonly updateExisting = signal(true);
  readonly submitting = signal(false);
  readonly parseError = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly result = signal<DeviceImportResult | null>(null);

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
      this.parseError.set('Paste or upload a JSON array of devices.');
      return;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(trimmed);
    } catch {
      this.parseError.set('Invalid JSON. Expected an array of device objects.');
      return;
    }

    if (!Array.isArray(payload)) {
      this.parseError.set('JSON must be an array of device objects.');
      return;
    }

    if (payload.length === 0) {
      this.parseError.set('The array is empty. Add at least one device record.');
      return;
    }

    this.submitting.set(true);
    this.deviceService
      .import(payload, this.updateExisting())
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
    return formatHttpError(err, 'Could not import devices.');
  }
}
