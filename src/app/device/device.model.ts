/** Matches `me.pixka.iot.d.Device` JSON from `/rest/iot/device/*`. */
export interface Device {
  id: number;
  name: string | null;
  code: string | null;
  ip: string | null;
  mac: string | null;
  description: string | null;
  version: string | null;
  lastupdate: string | null;
  lastcheckin: string | null;
  lastuptime: number | null;
}

/** Matches `me.pixka.iot.o.SearchOption`. */
export interface SearchOption {
  search?: string;
  page?: number;
  limit?: number;
}

/** Fields sent on create/update (editable in the UI). */
export interface DeviceFormValue {
  name: string;
  code: string;
  ip: string;
  mac: string;
  description: string;
  version: string;
}
