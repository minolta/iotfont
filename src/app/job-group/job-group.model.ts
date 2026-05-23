/** Matches `me.pixka.iot.d.JobGroup` JSON from `/rest/iot/jobgroup/*`. */
export interface JobGroup {
  id: number;
  name: string | null;
}

export interface JobGroupFormValue {
  name: string;
}
