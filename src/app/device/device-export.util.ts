import type { Device } from './device.model';
import type { DeviceImportPayload } from './device-import.model';

export function devicesToExportPayload(devices: Device[]): DeviceImportPayload {
  return devices.map((device) => ({
    name: device.name,
    code: device.code,
    ip: device.ip,
    mac: device.mac,
    description: device.description,
    version: device.version,
  }));
}
