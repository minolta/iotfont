import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  catchError,
  combineLatest,
  EMPTY,
  finalize,
  map,
  of,
  switchMap,
  timer,
} from 'rxjs';

import type { Device } from '../device/device.model';
import { DeviceService } from '../device/device.service';
import type { Humidity } from './humidity.model';
import { HumidityChartComponent } from './humidity-chart.component';
import { HumidityService } from './humidity.service';

@Component({
  selector: 'app-device-humidity',
  standalone: true,
  imports: [RouterLink, HumidityChartComponent],
  templateUrl: './device-humidity.component.html',
  styleUrl: './device-humidity.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceHumidityComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly deviceService = inject(DeviceService);
  private readonly humidityService = inject(HumidityService);

  readonly pageSize = 50;
  readonly deviceId = signal<number | null>(null);
  readonly device = signal<Device | null>(null);
  readonly deviceLoading = signal(true);
  readonly deviceError = signal<string | null>(null);
  readonly devicesLoading = signal(true);
  readonly devicesError = signal<string | null>(null);

  readonly devices = toSignal(
    this.deviceService.list().pipe(
      catchError(() => {
        this.devicesError.set('Could not load device list.');
        return of([] as Device[]);
      }),
      finalize(() => this.devicesLoading.set(false)),
    ),
    { initialValue: [] as Device[] },
  );

  readonly page = signal(0);
  readonly useDateFilter = signal(false);
  readonly startDate = signal('');
  readonly endDate = signal('');

  readonly latest = signal<Humidity | null>(null);
  readonly latestLoading = signal(false);
  readonly latestError = signal<string | null>(null);

  readonly readingsLoading = signal(false);
  readonly readingsError = signal<string | null>(null);
  readonly refreshNonce = signal(0);
  readonly autoRefreshEnabled = signal(true);

  readonly readings = toSignal(
    combineLatest([
      toObservable(this.deviceId),
      toObservable(this.page),
      toObservable(this.useDateFilter),
      toObservable(this.startDate),
      toObservable(this.endDate),
      toObservable(this.refreshNonce),
    ]).pipe(
      switchMap(([deviceId, page, useDateFilter, startDate, endDate]) => {
        if (deviceId == null) {
          return of([] as Humidity[]);
        }
        const showLoading = this.readings().length === 0;
        if (showLoading) {
          this.readingsLoading.set(true);
        }
        this.readingsError.set(null);
        const request$ = useDateFilter
          ? this.loadByDateRange(deviceId, startDate, endDate)
          : this.humidityService.getByDevice(deviceId, page, this.pageSize);
        return request$.pipe(
          catchError(() => {
            this.readingsError.set('Could not load humidity readings.');
            return of([] as Humidity[]);
          }),
          finalize(() => this.readingsLoading.set(false)),
        );
      }),
    ),
    { initialValue: [] as Humidity[] },
  );

  constructor() {
    this.route.paramMap
      .pipe(
        map((pm) => Number(pm.get('id') ?? '')),
        switchMap((id) => {
          if (!Number.isFinite(id) || id < 1) {
            this.deviceLoading.set(false);
            this.deviceError.set('Invalid device ID.');
            this.deviceId.set(null);
            this.device.set(null);
            return EMPTY;
          }
          this.deviceId.set(id);
          this.resetReadingsState();
          this.deviceLoading.set(true);
          this.deviceError.set(null);
          return this.deviceService.getById(id).pipe(
            catchError(() => {
              this.deviceError.set('Could not load device.');
              return EMPTY;
            }),
            finalize(() => this.deviceLoading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((device) => {
        if (!device) {
          if (!this.deviceError()) {
            this.deviceError.set('Device not found.');
          }
          this.device.set(null);
          return;
        }
        this.device.set(device);
        this.loadLatest(device.id);
      });

    combineLatest([
      toObservable(this.autoRefreshEnabled),
      toObservable(this.deviceId),
      toObservable(this.useDateFilter),
      toObservable(this.refreshNonce),
    ])
      .pipe(
        switchMap(([enabled, deviceId, useDateFilter]) => {
          if (deviceId == null || useDateFilter || !enabled) {
            return EMPTY;
          }
          return timer(5000, 5000);
        }),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.refreshNonce.update((n) => n + 1);
        const deviceId = this.deviceId();
        if (deviceId != null) {
          this.loadLatest(deviceId, false);
        }
      });
  }

  refresh(): void {
    this.refreshNonce.update((n) => n + 1);
    const deviceId = this.deviceId();
    if (deviceId != null) {
      this.loadLatest(deviceId, false);
    }
  }

  toggleAutoRefresh(enabled: boolean): void {
    this.autoRefreshEnabled.set(enabled);
    this.refreshNonce.update((n) => n + 1);
  }

  deviceLabel(device: Device | null = this.device()): string {
    if (!device) {
      return '';
    }
    return device.name?.trim() || device.code?.trim() || `Device #${device.id}`;
  }

  deviceOptionLabel(device: Device): string {
    const label = this.deviceLabel(device);
    return `#${device.id} — ${label}`;
  }

  onDeviceChange(value: string): void {
    const id = Number(value);
    if (!Number.isFinite(id) || id < 1 || id === this.deviceId()) {
      return;
    }
    void this.router.navigate(['/devices', id, 'humidity']);
  }

  onStartDateInput(value: string): void {
    this.startDate.set(value);
  }

  onEndDateInput(value: string): void {
    this.endDate.set(value);
  }

  applyDateFilter(): void {
    if (!this.startDate().trim() || !this.endDate().trim()) {
      this.readingsError.set('Start and end date are required.');
      return;
    }
    this.readingsError.set(null);
    this.page.set(0);
    this.useDateFilter.set(true);
    this.refreshNonce.update((n) => n + 1);
  }

  clearDateFilter(): void {
    this.useDateFilter.set(false);
    this.startDate.set('');
    this.endDate.set('');
    this.page.set(0);
    this.readingsError.set(null);
    this.refreshNonce.update((n) => n + 1);
  }

  previousPage(): void {
    if (this.useDateFilter() || this.page() <= 0) {
      return;
    }
    this.page.update((p) => p - 1);
  }

  nextPage(): void {
    if (this.useDateFilter() || this.readings().length < this.pageSize) {
      return;
    }
    this.page.update((p) => p + 1);
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }

  formatReading(value: number | string | null): string {
    if (value == null || value === '') {
      return '—';
    }
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : String(value);
  }

  private resetReadingsState(): void {
    this.page.set(0);
    this.useDateFilter.set(false);
    this.startDate.set('');
    this.endDate.set('');
    this.readingsError.set(null);
    this.latest.set(null);
    this.latestError.set(null);
    this.refreshNonce.update((n) => n + 1);
  }

  private loadLatest(deviceId: number, showLoading = true): void {
    if (showLoading || this.latest() === null) {
      this.latestLoading.set(true);
    }
    this.latestError.set(null);
    this.humidityService
      .getLatestByDevice(deviceId)
      .pipe(finalize(() => this.latestLoading.set(false)))
      .subscribe({
        next: (reading) => this.latest.set(reading),
        error: (err: unknown) => {
          this.latest.set(null);
          if (err instanceof HttpErrorResponse && err.status === 404) {
            this.latestError.set('No readings yet for this device.');
            return;
          }
          this.latestError.set('Could not load latest reading.');
        },
      });
  }

  private loadByDateRange(deviceId: number, start: string, end: string) {
    const s = this.toApiDate(start);
    const e = this.toApiDate(end);
    if (!s || !e) {
      this.readingsError.set('Invalid date range.');
      return of([] as Humidity[]);
    }
    return this.humidityService.getByDateRange({ id: deviceId, s, e });
  }

  private toApiDate(localValue: string): string | null {
    const trimmed = localValue.trim();
    if (!trimmed) {
      return null;
    }
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString().replace('Z', '.000Z');
  }
}
