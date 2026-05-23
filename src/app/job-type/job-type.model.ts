/** Matches `me.pixka.iot.d.JobType` JSON from `/rest/iot/jobtype/*`. */
export interface JobType {
  id: number;
  name: string | null;
  description: string | null;
}

export interface JobTypeFormValue {
  name: string;
  description: string;
}
