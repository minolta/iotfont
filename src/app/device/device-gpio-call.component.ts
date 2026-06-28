import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import { entityLabel, formatHttpError } from '../shared/format.util';

import type { Device } from './device.model';
import { DeviceInfoService } from './device-info.service';
import { DeviceService } from './device.service';

const DEFAULT_GPIO_PORTS = ['D1', 'D2', 'D4', 'D5', 'D6', 'D7', 'D8'] as const;

@Component({
  selector: 'app-device-gpio-call',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './device-gpio-call.component.html',
  styleUrl: './device-gpio-call.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceGpioCallComponent implements OnInit {
  private readonly deviceService = inject(DeviceService);
  private readonly deviceInfoService = inject(DeviceInfoService);

  readonly loadingDevices = signal(true);
  readonly devicesError = signal<string | null>(null);
  readonly devices = signal<Device[]>([]);

  readonly deviceId = signal('');
  readonly port = signal('D8');
  readonly customPort = signal('');
  readonly useCustomPort = signal(false);
  readonly value = signal('1');
  readonly delay = signal('200');
  readonly wait = signal('');

  readonly portOptions = signal<string[]>([...DEFAULT_GPIO_PORTS]);
  readonly loadingPorts = signal(false);
  readonly calling = signal(false);
  readonly callError = signal<string | null>(null);
  readonly lastResult = signal<{ ok: boolean; url: string; message: string | null } | null>(null);

  readonly selectedDevice = computed(() => {
    const id = Number(this.deviceId());
    if (!Number.isFinite(id) || id < 1) {
      return null;
    }
    return this.devices().find((d) => d.id === id) ?? null;
  });

  readonly effectivePort = computed(() => {
    if (this.useCustomPort()) {
      return this.customPort().trim().toUpperCase();
    }
    return this.port().trim().toUpperCase();
  });

  readonly previewUrl = computed(() => {
    const device = this.selectedDevice();
    const portName = this.effectivePort();
    if (!device?.ip?.trim() || !portName) {
      return '';
    }
    const host = device.ip.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
    const delay = this.parseDelay();
    const wait = this.parseWait();
    const base = `http://${host}/run?port=${portName}&value=${this.parseValue()}&delay=${delay}`;
    return wait > 0 ? `${base}&wait=${wait}` : base;
  });

  ngOnInit(): void {
    this.loadDevices();
  }

  onDeviceChange(value: string): void {
    this.deviceId.set(value);
    this.callError.set(null);
    this.lastResult.set(null);
    this.loadPortsForDevice(value);
  }

  onPortChange(value: string): void {
    this.port.set(value);
    this.useCustomPort.set(false);
    this.callError.set(null);
  }

  onCustomPortToggle(checked: boolean): void {
    this.useCustomPort.set(checked);
    this.callError.set(null);
  }

  callGpio(): void {
    const device = this.selectedDevice();
    const portName = this.effectivePort();
    if (!device) {
      this.callError.set('Select a device.');
      return;
    }
    if (!portName) {
      this.callError.set('Select or enter a GPIO port.');
      return;
    }
    if (!device.ip?.trim()) {
      this.callError.set('Selected device has no IP address.');
      return;
    }

    this.calling.set(true);
    this.callError.set(null);
    this.lastResult.set(null);

    const wait = this.parseWait();
    this.deviceInfoService
      .runGpio(device.id, {
        port: portName,
        value: this.parseValue(),
        delay: this.parseDelay(),
        ...(wait > 0 ? { wait } : {}),
      })
      .pipe(finalize(() => this.calling.set(false)))
      .subscribe({
        next: (response) => {
          this.lastResult.set({
            ok: response.ok,
            url: response.url,
            message: response.message ?? null,
          });
          if (!response.ok) {
            this.callError.set(response.message ?? 'Device call failed.');
          }
        },
        error: (err) => this.callError.set(formatHttpError(err, 'Could not call device.')),
      });
  }

  deviceLabel(device: Device): string {
    return entityLabel(device.name, device.code, device.id);
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
      .subscribe((devices) => this.devices.set(devices));
  }

  private loadPortsForDevice(deviceIdValue: string): void {
    const id = Number(deviceIdValue);
    if (!Number.isFinite(id) || id < 1) {
      this.portOptions.set([...DEFAULT_GPIO_PORTS]);
      return;
    }
    this.loadingPorts.set(true);
    this.deviceInfoService
      .fetchLiveJson(id)
      .pipe(
        catchError(() => of({} as Record<string, unknown>)),
        finalize(() => this.loadingPorts.set(false)),
      )
      .subscribe((json) => {
        const fromDevice = Object.keys(json)
          .filter((key) => /^D\d+$/i.test(key))
          .map((key) => key.toUpperCase())
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        const merged = [...new Set([...fromDevice, ...DEFAULT_GPIO_PORTS])].sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true }),
        );
        this.portOptions.set(merged);
        if (merged.length && !merged.includes(this.port())) {
          this.port.set(merged.includes('D8') ? 'D8' : merged[0]);
        }
      });
  }

  private parseValue(): number {
    return this.value() === '0' ? 0 : 1;
  }

  private parseDelay(): number {
    const parsed = Number(this.delay());
    return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
  }

  private parseWait(): number {
    const raw = this.wait().trim();
    if (!raw) {
      return 0;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
  }
}
