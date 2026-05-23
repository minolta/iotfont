import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  catchError,
  combineLatest,
  EMPTY,
  finalize,
  of,
  switchMap,
  timer,
} from 'rxjs';

import { displayValue, formatDateTime, formatHttpError } from '../shared/format.util';
import type { RunningTask } from './task.model';
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

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly activeCount = signal(0);
  readonly bufferSize = signal(0);
  readonly tasks = signal<RunningTask[]>([]);
  readonly autoRefreshEnabled = signal(true);
  readonly refreshNonce = signal(0);
  readonly killingJobId = signal<number | null>(null);
  readonly killError = signal<string | null>(null);
  readonly displayValue = displayValue;
  readonly formatDateTime = formatDateTime;

  constructor() {
    combineLatest([
      toObservable(this.autoRefreshEnabled),
      toObservable(this.refreshNonce),
    ])
      .pipe(
        switchMap(([enabled]) => {
          const poll$ = enabled ? timer(0, 5000) : timer(0);
          return poll$.pipe(switchMap(() => this.loadRunning()));
        }),
        takeUntilDestroyed(),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }
        this.activeCount.set(response.activeCount);
        this.bufferSize.set(response.bufferSize);
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

  taskLabel(task: RunningTask): string {
    return task.jobName?.trim() || `#${task.jobId}`;
  }

  deviceLabel(task: RunningTask): string {
    return task.deviceName?.trim() || (task.deviceId != null ? `#${task.deviceId}` : '—');
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

  private loadRunning() {
    const showLoading = this.tasks().length === 0 && this.loading();
    if (showLoading || this.tasks().length === 0) {
      this.loading.set(true);
    }
    this.error.set(null);
    return this.taskService.getRunning().pipe(
      catchError(() => {
        this.error.set('Could not load running tasks. Is the backend running with Task API?');
        this.activeCount.set(0);
        this.bufferSize.set(0);
        this.tasks.set([]);
        return of(null);
      }),
      finalize(() => this.loading.set(false)),
    );
  }
}
