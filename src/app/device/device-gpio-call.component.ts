import { ChangeDetectionStrategy, Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';

import { entityLabel, formatHttpError } from '../shared/format.util';

import type { Device } from './device.model';
import { DeviceInfoService } from './device-info.service';
import { DeviceService } from './device.service';

const DEFAULT_GPIO_PORTS = ['D1', 'D2', 'D4', 'D5', 'D6', 'D7', 'D8'] as const;

export interface GpioCallRow {
  id: string;
  deviceId: number | null;
  port: string;
  useCustomPort: boolean;
  customPort: string;
  value: number; // 0 or 1
  delay: number;
  wait: number;
  
  // Real-time status
  status: 'idle' | 'calling' | 'success' | 'failed';
  message: string | null;
  url: string | null;
}

@Component({
  selector: 'app-device-gpio-call',
  standalone: true,
  imports: [RouterLink, UpperCasePipe],
  templateUrl: './device-gpio-call.component.html',
  styleUrl: './device-gpio-call.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceGpioCallComponent implements OnInit, OnDestroy {
  private readonly deviceService = inject(DeviceService);
  private readonly deviceInfoService = inject(DeviceInfoService);

  readonly loadingDevices = signal(true);
  readonly devicesError = signal<string | null>(null);
  readonly devices = signal<Device[]>([]);

  // The collection of configured GPIO call rows
  readonly rows = signal<GpioCallRow[]>([]);
  readonly calling = signal(false);
  readonly callError = signal<string | null>(null);

  readonly portOptions = signal<string[]>([...DEFAULT_GPIO_PORTS]);

  // Delay before firing execution
  readonly executionDelay = signal(0);
  readonly countdownSeconds = signal(0);
  readonly countdownActive = signal(false);
  private countdownIntervalId: any = null;

  private static readonly STORAGE_KEY_ROWS = 'iot-device-gpio-call-rows';
  private static readonly STORAGE_KEY_DELAY = 'iot-device-gpio-call-delay';

  // Expose JS globals for the template expressions
  protected readonly Number = Number;
  protected readonly Math = Math;

  ngOnInit(): void {
    this.loadSavedState();
    this.loadDevices();
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  private loadSavedState(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const savedDelay = localStorage.getItem(DeviceGpioCallComponent.STORAGE_KEY_DELAY);
      if (savedDelay !== null) {
        const parsedDelay = parseInt(savedDelay, 10);
        if (!isNaN(parsedDelay) && parsedDelay >= 0) {
          this.executionDelay.set(parsedDelay);
        }
      }

      const savedRowsStr = localStorage.getItem(DeviceGpioCallComponent.STORAGE_KEY_ROWS);
      if (savedRowsStr) {
        const parsedRows = JSON.parse(savedRowsStr) as Partial<GpioCallRow>[];
        if (Array.isArray(parsedRows) && parsedRows.length > 0) {
          const restoredRows: GpioCallRow[] = parsedRows.map((r) => ({
            id: r.id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)),
            deviceId:
              r.deviceId !== null && r.deviceId !== undefined && !isNaN(Number(r.deviceId))
                ? Number(r.deviceId)
                : null,
            port: r.port || 'D1',
            useCustomPort: !!r.useCustomPort,
            customPort: r.customPort || '',
            value: r.value === 0 ? 0 : 1,
            delay: typeof r.delay === 'number' ? r.delay : 200,
            wait: typeof r.wait === 'number' ? r.wait : 0,
            status: 'idle',
            message: null,
            url: null,
          }));
          this.rows.set(restoredRows);
        }
      }
    } catch {
      // Ignore storage parse errors
    }
  }

  private saveState(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const exportableRows = this.rows().map((r) => ({
        id: r.id,
        deviceId: r.deviceId,
        port: r.port,
        useCustomPort: r.useCustomPort,
        customPort: r.customPort,
        value: r.value,
        delay: r.delay,
        wait: r.wait,
      }));
      localStorage.setItem(DeviceGpioCallComponent.STORAGE_KEY_ROWS, JSON.stringify(exportableRows));
      localStorage.setItem(DeviceGpioCallComponent.STORAGE_KEY_DELAY, this.executionDelay().toString());
    } catch {
      // Ignore storage write errors
    }
  }

  private loadDevices(): void {
    this.loadingDevices.set(true);
    this.devicesError.set(null);
    this.deviceService
      .list()
      .pipe(
        catchError((err) => {
          this.devicesError.set(formatHttpError(err, 'Could not load devices.'));
          return of([] as Device[]);
        }),
        finalize(() => this.loadingDevices.set(false)),
      )
      .subscribe((devices) => {
        this.devices.set(devices);
        // Recalculate preview URLs with updated devices list
        this.rows.update((list) =>
          list.map((r) => ({ ...r, url: this.calculateUrl(r) }))
        );
        // Add an initial row only if no saved rows were loaded
        if (devices.length > 0 && this.rows().length === 0) {
          this.addRow();
        }
      });
  }

  addRow(): void {
    const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
    const defaultDevice = this.devices().length > 0 ? this.devices()[0].id : null;
    
    this.rows.update((list) => [
      ...list,
      {
        id: newId,
        deviceId: defaultDevice,
        port: 'D1',
        useCustomPort: false,
        customPort: '',
        value: 1,
        delay: 200,
        wait: 0,
        status: 'idle',
        message: null,
        url: null,
      },
    ]);
    this.saveState();
  }

  removeRow(id: string): void {
    this.rows.update((list) => list.filter((r) => r.id !== id));
    this.saveState();
  }

  updateRow(id: string, updates: Partial<GpioCallRow>): void {
    this.rows.update((list) =>
      list.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...updates };
        // Recalculate preview URL inline if device/port changes
        updated.url = this.calculateUrl(updated);
        return updated;
      })
    );
    this.saveState();
  }

  updateExecutionDelay(val: number): void {
    this.executionDelay.set(val);
    this.saveState();
  }

  deviceLabel(device: Device): string {
    return entityLabel(device.name, device.code, device.id);
  }

  private calculateUrl(row: GpioCallRow): string | null {
    if (!row.deviceId) return null;
    const device = this.devices().find((d) => d.id === row.deviceId);
    if (!device?.ip?.trim()) return null;

    const host = device.ip.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
    const portName = row.useCustomPort ? row.customPort.trim().toUpperCase() : row.port;
    if (!portName) return null;

    const base = `http://${host}/run?port=${portName}&value=${row.value}&delay=${row.delay}`;
    return row.wait > 0 ? `${base}&wait=${row.wait}` : base;
  }

  callGpio(): void {
    const activeRows = this.rows();
    if (activeRows.length === 0) {
      this.callError.set('Add at least one call configuration row.');
      return;
    }

    // Verify all rows have valid device and port
    for (let i = 0; i < activeRows.length; i++) {
      const r = activeRows[i];
      if (!r.deviceId) {
        this.callError.set(`Row #${i + 1} has no device selected.`);
        return;
      }
      const portName = r.useCustomPort ? r.customPort.trim() : r.port;
      if (!portName) {
        this.callError.set(`Row #${i + 1} has no GPIO port specified.`);
        return;
      }
    }

    this.callError.set(null);

    const delayVal = this.executionDelay();
    if (delayVal > 0) {
      this.startCountdown(delayVal);
    } else {
      this.executeRequests();
    }
  }

  private startCountdown(seconds: number): void {
    this.clearCountdown();
    this.countdownActive.set(true);
    this.countdownSeconds.set(seconds);

    this.countdownIntervalId = setInterval(() => {
      this.countdownSeconds.update((s) => {
        if (s <= 1) {
          this.clearCountdown();
          this.executeRequests();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  cancelCountdown(): void {
    this.clearCountdown();
    this.rows.update((list) =>
      list.map((r) => ({ ...r, status: 'idle', message: null }))
    );
  }

  private clearCountdown(): void {
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
    this.countdownActive.set(false);
  }

  private executeRequests(): void {
    const activeRows = this.rows();
    this.calling.set(true);

    const requests = activeRows.map((row) => {
      this.updateRowStatus(row.id, 'calling', null, this.calculateUrl(row));

      const deviceId = row.deviceId;
      if (deviceId == null) {
        this.updateRowStatus(row.id, 'failed', 'Device selection is empty', null);
        return of({ ok: false, rowId: row.id });
      }

      const device = this.devices().find((d) => d.id === deviceId);
      if (!device?.ip?.trim()) {
        this.updateRowStatus(row.id, 'failed', 'Device has no IP address', null);
        return of({ ok: false, rowId: row.id });
      }

      const portName = row.useCustomPort ? row.customPort.trim().toUpperCase() : row.port;

      return this.deviceInfoService
        .runGpio(deviceId, {
          port: portName,
          value: row.value,
          delay: row.delay,
          ...(row.wait > 0 ? { wait: row.wait } : {}),
        })
        .pipe(
          map((res) => {
            if (res.ok) {
              this.updateRowStatus(row.id, 'success', res.message ?? 'Success', res.url);
            } else {
              this.updateRowStatus(row.id, 'failed', res.message ?? 'Device call failed', res.url);
            }
            return { ok: res.ok, rowId: row.id };
          }),
          catchError((err: unknown) => {
            const errStr = formatHttpError(err, 'Device call failed');
            this.updateRowStatus(row.id, 'failed', errStr, this.calculateUrl(row));
            return of({ ok: false, rowId: row.id });
          })
        );
    });

    forkJoin(requests)
      .pipe(finalize(() => this.calling.set(false)))
      .subscribe();
  }

  private updateRowStatus(
    id: string,
    status: GpioCallRow['status'],
    message: string | null,
    url: string | null
  ): void {
    this.rows.update((list) =>
      list.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, status, message };
        if (url) updated.url = url;
        return updated;
      })
    );
  }
}
