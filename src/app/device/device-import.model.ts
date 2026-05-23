import type { Device } from './device.model';

/** Request body for `POST /rest/iot/device/import`. */
export type DeviceImportPayload = Omit<
  Device,
  'id' | 'lastupdate' | 'lastcheckin' | 'lastuptime'
>[];

/** Response from `POST /rest/iot/device/import`. */
export interface DeviceImportResult {
  created: number;
  updated: number;
  skipped: number;
  total: number;
  errors: string[];
  devices: Device[];
}
