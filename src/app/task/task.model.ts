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

/** Matches `me.pixka.iot.o.HeapMemoryInfo`. */
export interface HeapMemoryInfo {
  usedBytes: number;
  maxBytes: number;
  committedBytes: number;
}

/** Matches `me.pixka.iot.o.RunningTasksResponse`. */
export interface RunningTasksResponse {
  activeCount: number;
  bufferSize: number;
  heapMemory: HeapMemoryInfo;
  tasks: RunningTask[];
}

/** Matches `me.pixka.iot.o.KillTaskResponse`. */
export interface KillTaskResponse {
  jobId: number;
  killed: boolean;
}

/** Matches `me.pixka.iot.o.DirectRunResponse`. */
export interface DirectRunResponse {
  jobId: number;
  started: boolean;
  message: string | null;
}
