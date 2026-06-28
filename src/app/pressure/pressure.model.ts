/** Matches `me.pixka.iot.d.Pressure` JSON from `/rest/iot/pressure/*`. */
export interface Pressure {
  id?: number;
  device_id?: number | null;
  device?: {
    id: number;
    name: string | null;
    code: string | null;
  } | null;
  psi: number | string | null;
  readtime?: string | null;
}

/** Matches `me.pixka.iot.o.SearchOption` for `/rest/iot/pressure/bydate`. */
export interface PressureDateSearch {
  id: number;
  s: string;
  e: string;
}
