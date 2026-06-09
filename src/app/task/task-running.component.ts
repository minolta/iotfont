import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  catchError,
  combineLatest,
  finalize,
  of,
  switchMap,
  timer,
} from 'rxjs';

import { JobTypeService } from '../job-type/job-type.service';
import { displayValue, formatDateTime, formatHttpError } from '../shared/format.util';
import type { HeapMemoryInfo, RunningTask } from './task.model';
import { TaskService } from './task.service';

@Component({
  selector: 'app-task-running',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './task-running.component.html',
  styleUrl: './task-running.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskRunningComponent {
  private readonly taskService = inject(TaskService);
  private readonly jobTypeService = inject(JobTypeService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly activeCount = signal(0);
  readonly bufferSize = signal(0);
  readonly heapMemory = signal<HeapMemoryInfo | null>(null);
  readonly tasks = signal<RunningTask[]>([]);
  readonly autoRefreshEnabled = signal(true);
  readonly refreshNonce = signal(0);
  readonly jobTypeFilter = signal('');
  readonly statusFilter = signal<'all' | 'running' | 'finished'>('all');
  readonly killingJobId = signal<number | null>(null);
  readonly killError = signal<string | null>(null);
  readonly displayValue = displayValue;
  readonly formatDateTime = formatDateTime;

  readonly jobTypes = toSignal(
    this.jobTypeService.list().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  readonly filteredTasks = computed(() => {
    const status = this.statusFilter();
    return this.tasks().filter((task) => {
      if (status === 'running' && !task.running) {
        return false;
      }
      if (status === 'finished' && task.running) {
        return false;
      }
      return true;
    });
  });

  readonly filteredActiveCount = computed(() => this.filteredTasks().filter((t) => t.running).length);

  constructor() {
    combineLatest([
      toObservable(this.autoRefreshEnabled),
      toObservable(this.refreshNonce),
      toObservable(this.jobTypeFilter),
    ])
      .pipe(
        switchMap(([enabled, , jobType]) => {
          const poll$ = enabled ? timer(0, 5000) : timer(0);
          return poll$.pipe(switchMap(() => this.loadRunning(jobType)));
        }),
        takeUntilDestroyed(),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }
        this.activeCount.set(response.activeCount);
        this.bufferSize.set(response.bufferSize);
        this.heapMemory.set(response.heapMemory);
        this.tasks.set(response.tasks);
      });
  }

  refresh(): void {
    this.refreshNonce.update((n) => n + 1);
  }

  toggleAutoRefresh(enabled: boolean): void {
    this.autoRefreshEnabled.set(enabled);
    this.refreshNonce.update((n) => n + 1);
  }

  onJobTypeFilterChange(value: string): void {
    this.jobTypeFilter.set(value);
    this.refreshNonce.update((n) => n + 1);
  }

  onStatusFilterChange(value: string): void {
    if (value === 'running' || value === 'finished' || value === 'all') {
      this.statusFilter.set(value);
    }
  }

  taskLabel(task: RunningTask): string {
    return task.jobName?.trim() || `#${task.jobId}`;
  }

  deviceLabel(task: RunningTask): string {
    return task.deviceName?.trim() || (task.deviceId != null ? `#${task.deviceId}` : '—');
  }

  jobTypeLabel(name: string | null | undefined): string {
    const trimmed = name?.trim();
    return trimmed || '—';
  }

  heapUsedLabel(): string {
    const heap = this.heapMemory();
    if (!heap) {
      return '—';
    }
    return this.formatBytes(heap.usedBytes);
  }

  heapMaxLabel(): string {
    const heap = this.heapMemory();
    if (!heap) {
      return '—';
    }
    return this.formatBytes(heap.maxBytes);
  }

  heapUsagePercent(): number | null {
    const heap = this.heapMemory();
    if (!heap || heap.maxBytes <= 0) {
      return null;
    }
    return Math.min(100, Math.round((heap.usedBytes / heap.maxBytes) * 100));
  }

  private formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) {
      return '—';
    }
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit++;
    }
    return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
  }

  killTask(task: RunningTask): void {
    this.killError.set(null);
    const label = this.taskLabel(task);
    if (!window.confirm(`Kill running task "${label}"?`)) {
      return;
    }
    this.killingJobId.set(task.jobId);
    this.taskService
      .kill(task.jobId)
      .pipe(finalize(() => this.killingJobId.set(null)))
      .subscribe({
        next: () => this.refreshNonce.update((n) => n + 1),
        error: (err: unknown) => {
          this.killError.set(formatHttpError(err, 'Could not kill task.'));
        },
      });
  }

  private loadRunning(jobType: string) {
    const showLoading = this.tasks().length === 0 && this.loading();
    if (showLoading || this.tasks().length === 0) {
      this.loading.set(true);
    }
    this.error.set(null);
    const apiJobType = jobType.trim() || undefined;
    return this.taskService.getRunning(apiJobType).pipe(
      catchError(() => {
        this.error.set('Could not load running tasks. Is the backend running with Task API?');
        this.activeCount.set(0);
        this.bufferSize.set(0);
        this.heapMemory.set(null);
        this.tasks.set([]);
        return of(null);
      }),
      finalize(() => this.loading.set(false)),
    );
  }
}
