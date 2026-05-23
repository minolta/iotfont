import type { JobExportPayload } from './job-export.util';
import type { Job } from './job.model';

/** Request body for `POST /rest/iot/job/import`. */
export type JobImportPayload = JobExportPayload;

/** Response from `POST /rest/iot/job/import`. */
export interface JobImportResult {
  created: number;
  updated: number;
  skipped: number;
  total: number;
  errors: string[];
  jobs: Job[];
}
