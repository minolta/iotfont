/** Matches `me.pixka.iot.d.JobLog` JSON from `/rest/iot/joblog/*`. */
export interface JobLog {
  id: number;
  job_id: number | null;
  level: string | null;
  message: string | null;
  state: string | null;
  logtime: string | null;
}

export type JobLogLevel = 'START' | 'RUN' | 'ERROR' | 'COMPLETE';

export const JOB_LOG_LEVEL_OPTIONS: JobLogLevel[] = ['START', 'RUN', 'ERROR', 'COMPLETE'];

export interface JobLogSearchOption {
  search?: string;
  page?: number;
  limit?: number;
  id?: number;
  jobId?: number;
  level?: string;
  s?: string;
  e?: string;
}

export interface JobLogDateSearch {
  id?: number;
  s: string;
  e: string;
}

export interface JobLogDeleteResult {
  deleted: number;
}

export interface JobLogCountResult {
  total: number;
  matching: number;
}
