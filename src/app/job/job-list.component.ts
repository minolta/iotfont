import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, finalize, map, of, switchMap, timer } from 'rxjs';

import { DeviceService } from '../device/device.service';
import {
  displayValue,
  entityLabel,
  formatHumidityRange,
  formatHttpError,
  formatTemperatureRange,
  jobLinkRel,
  jobLinkTarget,
} from '../shared/format.util';
import { downloadJsonFile, timestampForFilename } from '../shared/download.util';
import { jobsToExportPayload } from './job-export.util';
import type { Job } from './job.model';
import { JobService } from './job.service';
import { TaskService } from '../task/task.service';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './job-list.component.html',
  styleUrl: '../shared/crud-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobListComponent {
  private readonly jobService = inject(JobService);
  private readonly taskService = inject(TaskService);
  private readonly deviceService = inject(DeviceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly createdId = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('created'))),
    { initialValue: null as string | null },
  );

  readonly updatedId = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('updated'))),
    { initialValue: null as string | null },
  );

  readonly searchTerm = signal(
    (typeof localStorage !== 'undefined' && localStorage.getItem('iot-job-search-keyword')) || '',
  );
  readonly deviceFilter = signal(this.route.snapshot.queryParamMap.get('deviceId') ?? '');
  readonly refreshNonce = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deletingId = signal<number | null>(null);
  readonly deleteError = signal<string | null>(null);
  readonly cloningId = signal<number | null>(null);
  readonly cloneError = signal<string | null>(null);
  readonly directRunError = signal<string | null>(null);
  readonly directRunningId = signal<number | null>(null);
  readonly exporting = signal(false);
  readonly exportError = signal<string | null>(null);

  readonly devices = toSignal(
    this.deviceService.list().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  constructor() {
    this.route.queryParamMap
      .pipe(
        map((params) => params.get('created') ?? params.get('updated')),
        takeUntilDestroyed(),
      )
      .subscribe((id) => {
        if (id) {
          this.refreshNonce.update((n) => n + 1);
        }
      });
  }

  readonly jobs = toSignal(
    combineLatest([
      toObservable(this.searchTerm),
      toObservable(this.deviceFilter),
      toObservable(this.refreshNonce),
    ]).pipe(
      switchMap(([q, deviceId]) => {
        this.loading.set(true);
        this.error.set(null);
        const trimmed = q.trim();
        const selectedDeviceId = Number(deviceId);
        const request$ =
          Number.isFinite(selectedDeviceId) && selectedDeviceId > 0
            ? this.jobService.getByDevice(selectedDeviceId, 0, 100)
            : trimmed
              ? this.jobService.search({ search: trimmed, page: 0, limit: 100 })
              : this.jobService.list();
        return timer(trimmed ? 300 : 0).pipe(
          switchMap(() =>
            request$.pipe(
              catchError(() => {
                this.error.set('Could not load jobs.');
                return of([] as Job[]);
              }),
              finalize(() => this.loading.set(false)),
            ),
          ),
        );
      }),
    ),
    { initialValue: [] as Job[] },
  );

  readonly displayValue = displayValue;
  readonly jobLinkTarget = jobLinkTarget;
  readonly jobLinkRel = jobLinkRel;
  readonly formatHumidityRange = formatHumidityRange;
  readonly formatTemperatureRange = formatTemperatureRange;

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('iot-job-search-keyword', value);
    }
  }

  onDeviceFilterChange(value: string): void {
    this.deviceFilter.set(value);
    this.searchTerm.set('');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('iot-job-search-keyword', '');
    }
  }

  deviceName(job: Job): string {
    if (job.device) {
      return entityLabel(job.device.name, job.device.code, job.device.id);
    }
    return job.device_id != null ? `#${job.device_id}` : '—';
  }

  jobTypeName(job: Job): string {
    if (job.jobtype?.name?.trim()) {
      return job.jobtype.name.trim();
    }
    return job.jobtype_id != null ? `#${job.jobtype_id}` : '—';
  }

  jobGroupName(job: Job): string {
    if (job.jobgroup?.name?.trim()) {
      return job.jobgroup.name.trim();
    }
    return job.jobgroup_id != null ? `#${job.jobgroup_id}` : '—';
  }

  exportJobs(): void {
    this.exportError.set(null);
    this.exporting.set(true);
    const deviceId = Number(this.deviceFilter());
    this.jobService
      .listForExport({
        search: this.searchTerm(),
        deviceId: Number.isFinite(deviceId) && deviceId > 0 ? deviceId : null,
      })
      .pipe(finalize(() => this.exporting.set(false)))
      .subscribe({
        next: (jobs) => {
          if (jobs.length === 0) {
            this.exportError.set('No jobs to export.');
            return;
          }
          downloadJsonFile(jobsToExportPayload(jobs), `jobs-${timestampForFilename()}.json`);
        },
        error: (err: unknown) => {
          this.exportError.set(formatHttpError(err, 'Could not export jobs.'));
        },
      });
  }

  deleteJob(job: Job): void {
    this.deleteError.set(null);
    const label = job.name?.trim() || `#${job.id}`;
    if (!window.confirm(`Delete job "${label}"?`)) {
      return;
    }
    this.deletingId.set(job.id);
    this.jobService
      .delete(job.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => this.refreshNonce.update((n) => n + 1),
        error: (err: unknown) => {
          this.deleteError.set(formatHttpError(err, 'Could not delete job.'));
        },
      });
  }

  cloneJob(job: Job): void {
    this.cloneError.set(null);
    const label = job.name?.trim() || `#${job.id}`;
    if (!window.confirm(`Clone job "${label}"? The copy will be created disabled.`)) {
      return;
    }
    this.cloningId.set(job.id);
    this.jobService
      .clone(job.id)
      .pipe(finalize(() => this.cloningId.set(null)))
      .subscribe({
        next: (created) => {
          this.refreshNonce.update((n) => n + 1);
          void this.router.navigate(['/jobs'], {
            queryParams: { created: created.id },
            queryParamsHandling: 'merge',
          });
        },
        error: (err: unknown) => {
          this.cloneError.set(formatHttpError(err, 'Could not clone job.'));
        },
      });
  }

  directRunJob(job: Job): void {
    this.directRunError.set(null);
    const label = job.name?.trim() || `#${job.id}`;
    if (
      !window.confirm(
        `Direct run job "${label}" now?\n\nBypasses schedule, temperature/humidity checks, and port conditions. Runs configured pumps and GPIO immediately.`,
      )
    ) {
      return;
    }
    this.directRunningId.set(job.id);
    this.taskService
      .directRun(job.id)
      .pipe(finalize(() => this.directRunningId.set(null)))
      .subscribe({
        next: () => this.refreshNonce.update((n) => n + 1),
        error: (err: unknown) => {
          this.directRunError.set(formatHttpError(err, 'Could not direct run job.'));
        },
      });
  }
}
