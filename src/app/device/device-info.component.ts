import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  catchError,
  combineLatest,
  EMPTY,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
  timer,
} from 'rxjs';

import { displayValue, entityLabel } from '../shared/format.util';
import type { Device } from './device.model';
import {
  AUTO_REFRESH_INTERVALS,
  buildDeviceJsonUrl,
  buildDeviceSetConfigUrl,
  columnHeaderLabel,
  createDeviceInfoGroup,
  formatDeviceInfoValue,
  loadAutoRefreshSettings,
  loadDeviceInfoGroupsState,
  normalizeColumnKey,
  saveAutoRefreshSettings,
  saveDeviceInfoGroupsState,
  type DeviceInfoGroup,
  type DeviceLiveRow,
} from './device-info.model';
import { DeviceInfoService } from './device-info.service';
import { DeviceService } from './device.service';

interface LiveFetchResult {
  device: Device;
  data: Record<string, unknown> | null;
  error: string | null;
}

@Component({
  selector: 'app-device-info',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './device-info.component.html',
  styleUrl: './device-info.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceInfoComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly deviceService = inject(DeviceService);
  private readonly deviceInfoService = inject(DeviceInfoService);
  private readonly initialGroupsState = loadDeviceInfoGroupsState();
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  readonly devicesLoading = signal(true);
  readonly devicesError = signal<string | null>(null);
  readonly liveLoading = signal(false);
  readonly refreshNonce = signal(0);
  readonly expandedId = signal<number | null>(null);
  readonly liveRows = signal<DeviceLiveRow[]>([]);
  readonly pickId = signal('');
  readonly newGroupName = signal('');
  readonly groups = signal<DeviceInfoGroup[]>(this.initialGroupsState.groups);
  readonly activeGroupId = signal(this.initialGroupsState.activeGroupId);
  readonly columnKeys = signal<string[]>(this.initialActiveGroupColumnKeys());
  readonly autoRefreshEnabled = signal(loadAutoRefreshSettings().enabled);
  readonly autoRefreshSeconds = signal(loadAutoRefreshSettings().seconds);
  readonly refreshIntervals = AUTO_REFRESH_INTERVALS;
  readonly toastMessage = signal<string | null>(null);
  readonly displayValue = displayValue;
  readonly columnHeaderLabel = columnHeaderLabel;
  readonly setConfigUrl = buildDeviceSetConfigUrl;

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

  readonly activeGroup = computed(
    () => this.groups().find((group) => group.id === this.activeGroupId()) ?? null,
  );

  readonly activeColumns = computed(() =>
    this.columnKeys()
      .map((key) => normalizeColumnKey(key))
      .filter((key) => key.length > 0),
  );

  readonly tableColspan = computed(() => this.activeColumns().length + 4);

  readonly selectedIds = computed(() => this.activeGroup()?.deviceIds ?? []);

  readonly selectedDevices = computed(() => {
    const ids = new Set(this.selectedIds());
    return this.devices().filter((d) => ids.has(d.id));
  });

  readonly availableDevices = computed(() => {
    const ids = new Set(this.selectedIds());
    return this.devices().filter((d) => !ids.has(d.id));
  });

  constructor() {
    toObservable(this.devices)
      .pipe(takeUntilDestroyed())
      .subscribe((devices) => {
        if (devices.length === 0) {
          return;
        }
        this.reconcileGroupDeviceIds(devices);
      });

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((qm) => {
      const add = Number(qm.get('add') ?? '');
      if (Number.isFinite(add) && add >= 1) {
        this.addDeviceId(add);
      }
    });

    combineLatest([toObservable(this.selectedDevices), toObservable(this.refreshNonce)])
      .pipe(
        switchMap(([devices]) => this.fetchSelectedLive(devices)),
        takeUntilDestroyed(),
      )
      .subscribe((rows) => this.liveRows.set(rows));

    combineLatest([
      toObservable(this.autoRefreshEnabled),
      toObservable(this.autoRefreshSeconds),
      toObservable(this.selectedIds),
    ])
      .pipe(
        switchMap(([enabled, seconds, ids]) => {
          if (!enabled || ids.length === 0) {
            return EMPTY;
          }
          return timer(seconds * 1000, seconds * 1000);
        }),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.refreshNonce.update((n) => n + 1));
  }

  private initialActiveGroupColumnKeys(): string[] {
    const group = this.initialGroupsState.groups.find(
      (item) => item.id === this.initialGroupsState.activeGroupId,
    );
    return group ? [...group.columnKeys] : ['uptime', 'v', 'i', 'h', 't'];
  }

  deviceLabel(device: Device): string {
    return entityLabel(device.name, device.code, device.id);
  }

  deviceOptionLabel(device: Device): string {
    return `#${device.id} — ${this.deviceLabel(device)}`;
  }

  onPickChange(value: string): void {
    this.pickId.set(value);
  }

  onNewGroupNameInput(value: string): void {
    this.newGroupName.set(value);
  }

  selectGroup(groupId: string): void {
    if (groupId === this.activeGroupId()) {
      return;
    }
    this.saveActiveGroupDraft();
    this.activeGroupId.set(groupId);
    const group = this.groups().find((item) => item.id === groupId);
    this.columnKeys.set(group ? [...group.columnKeys] : ['uptime', 'v', 'i', 'h', 't']);
    this.expandedId.set(null);
    this.pickId.set('');
    this.persistGroups();
    this.showToast(`Switched to ${group?.name ?? 'group'}.`);
    this.refreshNonce.update((n) => n + 1);
  }

  createGroup(): void {
    const name = this.newGroupName().trim();
    if (!name) {
      return;
    }
    const group = createDeviceInfoGroup(name);
    this.saveActiveGroupDraft();
    this.groups.update((items) => [...items, group]);
    this.activeGroupId.set(group.id);
    this.columnKeys.set([...group.columnKeys]);
    this.newGroupName.set('');
    this.expandedId.set(null);
    this.pickId.set('');
    this.persistGroups();
    this.showToast(`Group "${group.name}" created.`);
    this.refreshNonce.update((n) => n + 1);
  }

  deleteActiveGroup(): void {
    const activeId = this.activeGroupId();
    const items = this.groups();
    if (items.length <= 1) {
      return;
    }
    const deletedName = this.activeGroup()?.name ?? 'Group';
    const nextGroups = items.filter((group) => group.id !== activeId);
    const nextActive = nextGroups[0];
    this.groups.set(nextGroups);
    this.activeGroupId.set(nextActive.id);
    this.columnKeys.set([...nextActive.columnKeys]);
    this.expandedId.set(null);
    this.pickId.set('');
    this.persistGroups();
    this.showToast(`Group "${deletedName}" deleted.`);
    this.refreshNonce.update((n) => n + 1);
  }

  onColumnInput(index: number, value: string): void {
    this.columnKeys.update((keys) => keys.map((key, i) => (i === index ? value : key)));
  }

  addColumn(): void {
    this.columnKeys.update((keys) => [...keys, '']);
  }

  removeColumn(index: number): void {
    this.columnKeys.update((keys) => {
      if (keys.length <= 1) {
        return keys;
      }
      return keys.filter((_, i) => i !== index);
    });
    this.applyColumns();
  }

  applyColumns(): void {
    const keys = this.activeColumns();
    if (keys.length === 0) {
      return;
    }
    this.columnKeys.set([...keys]);
    this.updateActiveGroup({ columnKeys: keys });
    this.showToast('Fields saved.');
  }

  resetColumns(): void {
    this.columnKeys.set(['uptime', 'v', 'i', 'h', 't']);
    this.updateActiveGroup({ columnKeys: ['uptime', 'v', 'i', 'h', 't'] });
    this.showToast('Fields reset to defaults.');
  }

  addPicked(): void {
    const id = Number(this.pickId());
    if (!Number.isFinite(id) || id < 1) {
      return;
    }
    this.addDeviceId(id);
    this.pickId.set('');
  }

  addDeviceId(id: number): void {
    const current = this.selectedIds();
    if (current.includes(id)) {
      return;
    }
    this.updateActiveGroup({ deviceIds: [...current, id] });
    this.showToast('Device added to group.');
    this.refreshNonce.update((n) => n + 1);
  }

  removeDevice(id: number): void {
    this.updateActiveGroup({ deviceIds: this.selectedIds().filter((item) => item !== id) });
    this.liveRows.update((rows) => rows.filter((row) => row.device.id !== id));
    if (this.expandedId() === id) {
      this.expandedId.set(null);
    }
    this.showToast('Device removed from group.');
  }

  refresh(): void {
    if (this.selectedIds().length === 0) {
      return;
    }
    this.refreshNonce.update((n) => n + 1);
  }

  toggleAutoRefresh(enabled: boolean): void {
    this.autoRefreshEnabled.set(enabled);
    this.persistAutoRefresh();
  }

  onAutoRefreshInterval(value: string): void {
    const seconds = Number(value);
    if (!AUTO_REFRESH_INTERVALS.includes(seconds as (typeof AUTO_REFRESH_INTERVALS)[number])) {
      return;
    }
    this.autoRefreshSeconds.set(seconds);
    this.persistAutoRefresh();
  }

  toggleRaw(deviceId: number): void {
    this.expandedId.update((current) => (current === deviceId ? null : deviceId));
  }

  rawJsonText(row: DeviceLiveRow): string {
    if (!row.rawJson) {
      return '';
    }
    return JSON.stringify(row.rawJson, null, 2);
  }

  fieldValue(row: DeviceLiveRow, key: string): string {
    if (!row.rawJson) {
      return '—';
    }
    return formatDeviceInfoValue(key, row.rawJson[key]);
  }

  private updateActiveGroup(patch: Partial<Pick<DeviceInfoGroup, 'deviceIds' | 'columnKeys'>>): void {
    const activeId = this.activeGroupId();
    this.groups.update((items) =>
      items.map((group) =>
        group.id === activeId
          ? {
              ...group,
              ...patch,
              deviceIds: patch.deviceIds ?? group.deviceIds,
              columnKeys: patch.columnKeys ?? group.columnKeys,
            }
          : group,
      ),
    );
    this.persistGroups();
  }

  private saveActiveGroupDraft(): void {
    const keys = this.activeColumns();
    if (keys.length === 0) {
      return;
    }
    this.updateActiveGroup({ columnKeys: keys });
  }

  private persistGroups(): void {
    saveDeviceInfoGroupsState({
      activeGroupId: this.activeGroupId(),
      groups: this.groups(),
    });
  }

  private persistAutoRefresh(): void {
    saveAutoRefreshSettings({
      enabled: this.autoRefreshEnabled(),
      seconds: this.autoRefreshSeconds(),
    });
    this.showToast('Auto refresh settings saved.');
  }

  private showToast(message: string): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage.set(message);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
      this.toastTimer = undefined;
    }, 2000);
  }

  private reconcileGroupDeviceIds(devices: Device[]): void {
    const valid = new Set(devices.map((device) => device.id));
    let changed = false;
    const nextGroups = this.groups().map((group) => {
      const deviceIds = group.deviceIds.filter((id) => valid.has(id));
      if (deviceIds.length !== group.deviceIds.length) {
        changed = true;
      }
      return deviceIds.length === group.deviceIds.length ? group : { ...group, deviceIds };
    });
    if (changed) {
      this.groups.set(nextGroups);
      this.persistGroups();
      this.refreshNonce.update((n) => n + 1);
    }
  }

  private fetchSelectedLive(devices: Device[]) {
    if (devices.length === 0) {
      this.liveLoading.set(false);
      return of([] as DeviceLiveRow[]);
    }

    const showLoading = this.liveRows().length === 0;
    if (showLoading) {
      this.liveLoading.set(true);
    }
    const requests = devices.map((device) => this.fetchOne(device));

    return forkJoin(requests).pipe(
      map((results) => results.map((result) => this.toLiveRow(result))),
      finalize(() => this.liveLoading.set(false)),
    );
  }

  private fetchOne(device: Device) {
    const ip = device.ip?.trim() ?? '';
    const fetchUrl = buildDeviceJsonUrl(ip);
    if (!fetchUrl) {
      return of<LiveFetchResult>({
        device,
        data: null,
        error: 'No IP configured.',
      });
    }
    return this.deviceInfoService.fetchLiveJson(ip).pipe(
      map(
        (data) =>
          ({
            device,
            data: data as Record<string, unknown>,
            error: null,
          }) satisfies LiveFetchResult,
      ),
      catchError((err: unknown) =>
        of<LiveFetchResult>({
          device,
          data: null,
          error: this.formatLiveError(err),
        }),
      ),
    );
  }

  private toLiveRow(result: LiveFetchResult): DeviceLiveRow {
    const ip = result.device.ip?.trim() ?? '';
    return {
      device: result.device,
      label: this.deviceLabel(result.device),
      fetchUrl: buildDeviceJsonUrl(ip),
      loading: false,
      error: result.error,
      rawJson: result.data,
    };
  }

  private formatLiveError(err: unknown): string {
    if (err instanceof Error && err.message.includes('no IP')) {
      return err.message;
    }
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Unreachable (check IP / CORS).';
      }
      return `HTTP ${err.status}`;
    }
    return 'Could not load.';
  }
}
