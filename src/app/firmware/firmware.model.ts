/** me.pixka.iot.d.FwApp */
export interface FwApp {
  id: number;
  name: string | null;
}

/** me.pixka.iot.d.FwRelease */
export interface FwRelease {
  id: number;
  ver: number | null;
  name: string | null;
  app: FwApp | null;
  app_id: number | null;
  crc: string | null;
}

export interface FwSearchOption {
  search?: string;
  page?: number;
  limit?: number;
}

export interface FwUploadFormValue {
  appName: string;
  version: string;
  file: File | null;
}
