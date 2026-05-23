/** Matches `me.pixka.iot.o.RunningTaskDto`. */
export interface RunningTask {
  jobId: number;
  jobName: string | null;
  description: string | null;
  deviceId: number | null;
  deviceName: string | null;
  jobTypeName: string | null;
  running: boolean;
  state: string | null;
  startedAt: string | null;
}

/** Matches `me.pixka.iot.o.RunningTasksResponse`. */
export interface RunningTasksResponse {
  activeCount: number;
  bufferSize: number;
  tasks: RunningTask[];
}

/** Matches `me.pixka.iot.o.KillTaskResponse`. */
export interface KillTaskResponse {
  jobId: number;
  killed: boolean;
}
