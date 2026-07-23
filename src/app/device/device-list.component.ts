import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, finalize, map, of, switchMap, timer } from 'rxjs';

import { downloadJsonFile, timestampForFilename } from '../shared/download.util';
import { formatHttpError } from '../shared/format.util';
import type { Device } from './device.model';
import { devicesToExportPayload } from './device-export.util';
import { buildDeviceSetConfigUrl } from './device-info.model';
import { DeviceService } from './device.service';
import { TranslationService } from '../shared/translation.service';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './device-list.component.html',
  styleUrl: './device-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceListComponent {
  private readonly deviceService = inject(DeviceService);
  private readonly route = inject(ActivatedRoute);
  readonly translationService = inject(TranslationService);

  readonly createdId = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('created'))),
    { initialValue: null as string | null },
  );

  readonly updatedId = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('updated'))),
    { initialValue: null as string | null },
  );

  readonly searchTerm = signal(
    (typeof localStorage !== 'undefined' && localStorage.getItem('iot-device-search-keyword')) || '',
  );
  readonly refreshNonce = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deletingId = signal<number | null>(null);
  readonly deleteError = signal<string | null>(null);
  readonly exporting = signal(false);
  readonly exportError = signal<string | null>(null);

  readonly devices = toSignal(
    combineLatest([toObservable(this.searchTerm), toObservable(this.refreshNonce)]).pipe(
      switchMap(([q]) => {
        this.loading.set(true);
        this.error.set(null);
        const trimmed = q.trim();
        const request$ = trimmed
          ? this.deviceService.search({ search: trimmed, page: 0, limit: 50 })
          : this.deviceService.list();
        return timer(trimmed ? 300 : 0).pipe(
          switchMap(() =>
            request$.pipe(
              catchError(() => {
                this.error.set(this.translationService.translate('device.loadError'));
                return of([] as Device[]);
              }),
              finalize(() => this.loading.set(false)),
            ),
          ),
        );
      }),
    ),
    { initialValue: [] as Device[] },
  );

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('iot-device-search-keyword', value);
    }
  }

  exportDevices(): void {
    this.exportError.set(null);
    this.exporting.set(true);
    this.deviceService
      .listForExport(this.searchTerm())
      .pipe(finalize(() => this.exporting.set(false)))
      .subscribe({
        next: (devices) => {
          if (devices.length === 0) {
            this.exportError.set(this.translationService.translate('device.noExportData'));
            return;
          }
          downloadJsonFile(
            devicesToExportPayload(devices),
            `devices-${timestampForFilename()}.json`,
          );
        },
        error: (err: unknown) => {
          this.exportError.set(formatHttpError(err, this.translationService.translate('device.exportError')));
        },
      });
  }

  deleteDevice(device: Device): void {
    this.deleteError.set(null);
    const label = device.name?.trim() || device.code?.trim() || `#${device.id}`;
    const confirmTemplate = this.translationService.translate('device.confirmDelete');
    if (!window.confirm(confirmTemplate.replace('{name}', label))) {
      return;
    }
    this.deletingId.set(device.id);
    this.deviceService
      .delete(device.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => this.refreshNonce.update((n) => n + 1),
        error: (err: unknown) => {
          this.deleteError.set(this.extractErrorMessage(err));
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

  displayValue(value: string | null): string {
    return value?.trim() || '—';
  }

  setConfigUrl(ip: string | null): string | null {
    return buildDeviceSetConfigUrl(ip);
  }

  private extractErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (typeof body === 'object' && body !== null && 'message' in body) {
        const message = (body as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim().length > 0) {
          return message;
        }
      }
      if (typeof err.error === 'string' && err.error.trim().length > 0) {
        return err.error;
      }
    }
    return this.translationService.translate('device.deleteError');
  }
}
