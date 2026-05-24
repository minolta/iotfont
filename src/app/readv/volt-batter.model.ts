/** Matches `me.pixka.iot.d.VoltBatter` JSON from `/rest/iot/voltbatter/*`. */
export interface VoltBatter {
  id: number;
  device_id: number | null;
  device?: {
    id: number;
    name: string | null;
    code: string | null;
  } | null;
  v: number | string | null;
  i: number | string | null;
  p: number | string | null;
  e: number | string | null;
  readtime: string | null;
}

/** Matches `me.pixka.iot.o.SearchOption` for `/rest/iot/voltbatter/bydate`. */
export interface VoltBatterDateSearch {
  id: number;
  s: string;
  e: string;
}
