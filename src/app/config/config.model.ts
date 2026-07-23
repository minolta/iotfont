/** Matches `me.pixka.iot.d.SystemConfig` JSON from `/rest/iot/config/*`. */
export interface SystemConfig {
  id: number;
  cfg_key: string | null;
  cfg_value: string | null;
  description: string | null;
}

export interface SystemConfigFormValue {
  cfgKey: string;
  cfgValue: string;
  description: string;
}
