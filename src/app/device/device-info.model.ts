import type { Device } from './device.model';

export const DEFAULT_INFO_COLUMNS = ['uptime', 'v', 'i', 'h', 't'] as const;
export const INFO_COLUMNS_STORAGE_KEY = 'iot-device-info-columns';
export const AUTO_REFRESH_STORAGE_KEY = 'iot-device-info-auto-refresh';
export const SELECTED_DEVICES_STORAGE_KEY = 'iot-device-info-selected-devices';
export const GROUPS_STORAGE_KEY = 'iot-device-info-groups';
export const DEFAULT_AUTO_REFRESH_SECONDS = 10;
export const AUTO_REFRESH_INTERVALS = [5, 10, 30, 60] as const;

export const DEFAULT_INFO_GROUPS: DeviceInfoGroup[] = [
  {
    id: 'group-sensor',
    name: 'Sensor',
    deviceIds: [],
    columnKeys: ['uptime', 'h', 't'],
  },
  {
    id: 'group-grid',
    name: 'Grid',
    deviceIds: [],
    columnKeys: ['uptime', 'v', 'i'],
  },
];

export interface AutoRefreshSettings {
  enabled: boolean;
  seconds: number;
}

export interface DeviceInfoGroup {
  id: string;
  name: string;
  deviceIds: number[];
  columnKeys: string[];
}

export interface DeviceInfoGroupsState {
  activeGroupId: string;
  groups: DeviceInfoGroup[];
}

export interface DeviceInfoField {
  key: string;
  label: string;
  value: string;
}

/** Live JSON payload from the device. */
export type DeviceLiveJson = Record<string, unknown>;

function normalizeDeviceIds(ids: unknown[]): number[] {
  return [
    ...new Set(
      ids
        .map((item) => Number(item))
        .filter((id) => Number.isFinite(id) && id >= 1),
    ),
  ];
}

function normalizeColumnKeys(keys: unknown[]): string[] {
  const normalized = keys
    .filter((item): item is string => typeof item === 'string')
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
  return normalized.length > 0 ? normalized : [...DEFAULT_INFO_COLUMNS];
}

function normalizeGroup(raw: unknown): DeviceInfoGroup | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Partial<DeviceInfoGroup>;
  const id = typeof item.id === 'string' ? item.id.trim() : '';
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  if (!id || !name) {
    return null;
  }
  return {
    id,
    name,
    deviceIds: normalizeDeviceIds(Array.isArray(item.deviceIds) ? item.deviceIds : []),
    columnKeys: normalizeColumnKeys(Array.isArray(item.columnKeys) ? item.columnKeys : []),
  };
}

function migrateLegacyGroupsState(): DeviceInfoGroupsState {
  const deviceIds = loadStoredSelectedDeviceIds();
  const columnKeys = loadStoredColumnKeys();
  const groups =
    deviceIds.length > 0 || columnKeys.join() !== DEFAULT_INFO_COLUMNS.join(',')
      ? [
          {
            id: 'group-default',
            name: 'Default',
            deviceIds,
            columnKeys,
          },
          ...DEFAULT_INFO_GROUPS,
        ]
      : [...DEFAULT_INFO_GROUPS];
  return {
    activeGroupId: groups[0].id,
    groups,
  };
}

export function loadDeviceInfoGroupsState(): DeviceInfoGroupsState {
  if (typeof localStorage === 'undefined') {
    return { activeGroupId: DEFAULT_INFO_GROUPS[0].id, groups: [...DEFAULT_INFO_GROUPS] };
  }
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (!raw) {
      return migrateLegacyGroupsState();
    }
    const parsed = JSON.parse(raw) as Partial<DeviceInfoGroupsState>;
    const groups = (Array.isArray(parsed.groups) ? parsed.groups : [])
      .map((group) => normalizeGroup(group))
      .filter((group): group is DeviceInfoGroup => group != null);
    if (groups.length === 0) {
      return migrateLegacyGroupsState();
    }
    const activeGroupId =
      typeof parsed.activeGroupId === 'string' &&
      groups.some((group) => group.id === parsed.activeGroupId)
        ? parsed.activeGroupId
        : groups[0].id;
    return { activeGroupId, groups };
  } catch {
    return migrateLegacyGroupsState();
  }
}

export function saveDeviceInfoGroupsState(state: DeviceInfoGroupsState): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(state));
}

export function createDeviceInfoGroup(name: string): DeviceInfoGroup {
  return {
    id: `group-${Date.now()}`,
    name: name.trim(),
    deviceIds: [],
    columnKeys: [...DEFAULT_INFO_COLUMNS],
  };
}

export function loadStoredColumnKeys(): string[] {
  if (typeof localStorage === 'undefined') {
    return [...DEFAULT_INFO_COLUMNS];
  }
  try {
    const raw = localStorage.getItem(INFO_COLUMNS_STORAGE_KEY);
    if (!raw) {
      return [...DEFAULT_INFO_COLUMNS];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_INFO_COLUMNS];
    }
    return normalizeColumnKeys(parsed);
  } catch {
    return [...DEFAULT_INFO_COLUMNS];
  }
}

export function saveColumnKeys(keys: string[]): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(INFO_COLUMNS_STORAGE_KEY, JSON.stringify(keys));
}

export function loadAutoRefreshSettings(): AutoRefreshSettings {
  const fallback: AutoRefreshSettings = {
    enabled: true,
    seconds: DEFAULT_AUTO_REFRESH_SECONDS,
  };
  if (typeof localStorage === 'undefined') {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(AUTO_REFRESH_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<AutoRefreshSettings>;
    const seconds = Number(parsed.seconds);
    const validSeconds = AUTO_REFRESH_INTERVALS.includes(
      seconds as (typeof AUTO_REFRESH_INTERVALS)[number],
    )
      ? seconds
      : DEFAULT_AUTO_REFRESH_SECONDS;
    return {
      enabled: parsed.enabled !== false,
      seconds: validSeconds,
    };
  } catch {
    return fallback;
  }
}

export function saveAutoRefreshSettings(settings: AutoRefreshSettings): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(AUTO_REFRESH_STORAGE_KEY, JSON.stringify(settings));
}

export function loadStoredSelectedDeviceIds(): number[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(SELECTED_DEVICES_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return normalizeDeviceIds(parsed);
  } catch {
    return [];
  }
}

export function saveSelectedDeviceIds(ids: number[]): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(SELECTED_DEVICES_STORAGE_KEY, JSON.stringify(ids));
}

export function normalizeColumnKey(value: string): string {
  return value.trim();
}

export function columnHeaderLabel(key: string): string {
  const trimmed = key.trim();
  return trimmed || '—';
}

export function buildDeviceJsonUrl(ip: string): string | null {
  const trimmed = ip.trim();
  if (!trimmed) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `http://${trimmed}/`;
}

export function buildDeviceRestartUrl(ip: string | null | undefined): string | null {
  const trimmed = ip?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed.includes('://') ? trimmed : `http://${trimmed}`);
      return `${url.origin}/restart`;
    } catch {
      return null;
    }
  }
  return `http://${trimmed.replace(/\/+$/, '')}/restart`;
}

export function buildDeviceSetConfigUrl(ip: string | null | undefined): string | null {
  const trimmed = ip?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed.includes('://') ? trimmed : `http://${trimmed}`);
      return `${url.origin}/setconfigwww`;
    } catch {
      return null;
    }
  }
  return `http://${trimmed.replace(/\/+$/, '')}/setconfigwww`;
}

export function extractDeviceInfoFields(
  data: DeviceLiveJson,
  keys: readonly string[],
): DeviceInfoField[] {
  return keys
    .map((key) => normalizeColumnKey(key))
    .filter((key) => key.length > 0)
    .map((key) => ({
      key,
      label: columnHeaderLabel(key),
      value: formatDeviceInfoValue(key, data[key]),
    }));
}

export function formatDeviceInfoValue(key: string, value: unknown): string {
  if (value == null || value === '') {
    return '—';
  }
  if (key.toLowerCase() === 'uptime') {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return String(value);
    }
    return formatUptime(num);
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : String(value);
}

export interface DeviceLiveRow {
  device: Device;
  label: string;
  fetchUrl: string | null;
  loading: boolean;
  error: string | null;
  rawJson: Record<string, unknown> | null;
}

export function formatUptime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0 || days > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0 || hours > 0 || days > 0) {
    parts.push(`${minutes}m`);
  }
  parts.push(`${secs}s`);
  return `${parts.join(' ')} (${total}s)`;
}
