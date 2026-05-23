/** Matches `me.pixka.iot.d.Humidity` JSON from `/rest/iot/humidity/*`. */
export interface Humidity {
  id: number;
  device_id: number | null;
  device?: {
    id: number;
    name: string | null;
    code: string | null;
  } | null;
  h: number | string | null;
  t: number | string | null;
  readtime: string | null;
}

/** Matches `me.pixka.iot.o.SearchOption` for `/rest/iot/humidity/bydate`. */
export interface HumidityDateSearch {
  id: number;
  s: string;
  e: string;
}
