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
import { formatDateTime } from '../shared/format.util';
import { ReadvChartComponent } from './readv-chart.component';
import type { VoltBatter } from './volt-batter.model';
import { VoltBatterService } from './volt-batter.service';

@Component({
  selector: 'app-readv-page',
  standalone: true,
  imports: [RouterLink, ReadvChartComponent],
  templateUrl: './readv-page.component.html',
  styleUrl: './readv-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadvPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly deviceService = inject(DeviceService);
  private readonly voltBatterService = inject(VoltBatterService);

  readonly pageSize = 50;
  readonly deviceId = signal<number | null>(null);
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

  readonly latest = signal<VoltBatter | null>(null);
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
          return of([] as VoltBatter[]);
        }
        const showLoading = this.readings().length === 0;
        if (showLoading) {
          this.readingsLoading.set(true);
        }
        this.readingsError.set(null);
        const request$ = useDateFilter
          ? this.loadByDateRange(deviceId, startDate, endDate)
          : this.voltBatterService.getByDevice(deviceId, page, this.pageSize);
        return request$.pipe(
          catchError(() => {
            this.readingsError.set('Could not load battery readings.');
            return of([] as VoltBatter[]);
          }),
          finalize(() => this.readingsLoading.set(false)),
        );
      }),
    ),
    { initialValue: [] as VoltBatter[] },
  );

  readonly formatDate = formatDateTime;

  constructor() {
    combineLatest([
      this.route.queryParamMap.pipe(map((qp) => Number(qp.get('deviceId') ?? ''))),
      toObservable(this.devices),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([queryId, devices]) => {
        if (devices.length === 0) {
          this.deviceId.set(null);
          return;
        }
        const validQuery = Number.isFinite(queryId) && queryId > 0 && devices.some((d) => d.id === queryId);
        const nextId = validQuery ? queryId : devices[0].id;
        if (this.deviceId() !== nextId) {
          this.resetReadingsState();
          this.deviceId.set(nextId);
          this.loadLatest(nextId);
        }
        if (!validQuery && queryId !== nextId) {
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { deviceId: nextId },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }
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

  deviceLabel(device: Device): string {
    return device.name?.trim() || device.code?.trim() || `Device #${device.id}`;
  }

  deviceOptionLabel(device: Device): string {
    return `#${device.id} — ${this.deviceLabel(device)}`;
  }

  selectedDeviceLabel(): string {
    const id = this.deviceId();
    if (id == null) {
      return '—';
    }
    const device = this.devices().find((item) => item.id === id);
    return device ? this.deviceLabel(device) : `#${id}`;
  }

  onDeviceChange(value: string): void {
    const id = Number(value);
    if (!Number.isFinite(id) || id < 1 || id === this.deviceId()) {
      return;
    }
    this.resetReadingsState();
    this.deviceId.set(id);
    this.loadLatest(id);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { deviceId: id },
      queryParamsHandling: 'merge',
    });
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
    this.voltBatterService
      .getLatestByDevice(deviceId)
      .pipe(finalize(() => this.latestLoading.set(false)))
      .subscribe({
        next: (reading) => this.latest.set(reading),
        error: (err: unknown) => {
          this.latest.set(null);
          if (err instanceof HttpErrorResponse && err.status === 404) {
            this.latestError.set('No ReadV readings yet for this device.');
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
      return of([] as VoltBatter[]);
    }
    return this.voltBatterService.getByDateRange({ id: deviceId, s, e });
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
