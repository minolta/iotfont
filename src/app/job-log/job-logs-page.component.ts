import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  catchError,
  combineLatest,
  finalize,
  interval,
  map,
  merge,
  of,
  switchMap,
  timer,
} from 'rxjs';

import { formatDateTime, formatHttpError } from '../shared/format.util';
import type { Job } from '../job/job.model';
import { JobService } from '../job/job.service';
import { JOB_LOG_LEVEL_OPTIONS } from './job-log.model';
import type { JobLog, JobLogCountResult, JobLogSearchOption } from './job-log.model';
import { JobLogService } from './job-log.service';

@Component({
  selector: 'app-job-logs-page',
  standalone: true,
  templateUrl: './job-logs-page.component.html',
  styleUrls: ['../shared/crud-page.css', './job-logs-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobLogsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobService = inject(JobService);
  private readonly jobLogService = inject(JobLogService);

  readonly pageSize = 100;
  readonly pollIntervalMs = 5000;
  readonly levelOptions = JOB_LOG_LEVEL_OPTIONS;

  readonly jobs = toSignal(
    this.jobService.list().pipe(catchError(() => of([] as Job[]))),
    { initialValue: [] as Job[] },
  );

  readonly jobFilter = signal('');
  readonly levelFilter = signal('');
  readonly searchTerm = signal('');
  readonly useDateFilter = signal(false);
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly page = signal(0);
  readonly refreshNonce = signal(0);
  readonly loading = signal(false);
  readonly manualRefreshing = signal(false);
  readonly deleting = signal(false);
  readonly error = signal<string | null>(null);
  readonly deleteMessage = signal<string | null>(null);

  private readonly logFilters = combineLatest([
    toObservable(this.jobFilter),
    toObservable(this.levelFilter),
    toObservable(this.searchTerm),
    toObservable(this.useDateFilter),
    toObservable(this.startDate),
    toObservable(this.endDate),
    toObservable(this.page),
    toObservable(this.refreshNonce),
  ]);

  private readonly logPoll$ = merge(
    of('immediate' as const),
    interval(this.pollIntervalMs).pipe(map(() => 'poll' as const)),
  );

  readonly logStats = toSignal(
    this.logFilters.pipe(
      switchMap(([jobId, level, search, useDateFilter, startDate, endDate]) =>
        this.logPoll$.pipe(
          switchMap((trigger) => {
            const option = this.buildSearchOption(jobId, level, search, useDateFilter, startDate, endDate);
            if (!option) {
              return of(null as JobLogCountResult | null);
            }

            const debounceMs =
              trigger === 'immediate' && search.trim() && !useDateFilter ? 300 : 0;
            return timer(debounceMs).pipe(
              switchMap(() =>
                this.jobLogService.getCount(option).pipe(
                  catchError(() => of(null as JobLogCountResult | null)),
                ),
              ),
            );
          }),
        ),
      ),
    ),
    { initialValue: null as JobLogCountResult | null },
  );

  readonly logs = toSignal(
    this.logFilters.pipe(
      switchMap(([jobId, level, search, useDateFilter, startDate, endDate, page]) =>
        this.logPoll$.pipe(
          switchMap((trigger) => {
            const option = this.buildSearchOption(jobId, level, search, useDateFilter, startDate, endDate);
            if (!option) {
              return of([] as JobLog[]);
            }

            const showLoading =
              trigger === 'immediate' && (this.logs().length === 0 || this.manualRefreshing());
            if (showLoading) {
              this.loading.set(true);
            }
            if (trigger === 'immediate') {
              this.error.set(null);
            }

            const debounceMs =
              trigger === 'immediate' && search.trim() && !useDateFilter ? 300 : 0;
            const request$ = useDateFilter
              ? this.jobLogService.getByDateRange({
                  id: option.jobId,
                  s: option.s ?? '',
                  e: option.e ?? '',
                })
              : timer(debounceMs).pipe(
                  switchMap(() => {
                    const trimmedSearch = search.trim();
                    const trimmedLevel = level.trim();
                    if (trimmedSearch || trimmedLevel || option.jobId == null) {
                      return this.jobLogService.search({
                        jobId: option.jobId,
                        search: trimmedSearch,
                        level: trimmedLevel || undefined,
                        page,
                        limit: this.pageSize,
                      });
                    }
                    return this.jobLogService.getByJob(option.jobId, page, this.pageSize);
                  }),
                );

            return request$.pipe(
              catchError(() => {
                if (trigger === 'immediate') {
                  this.error.set('Could not load job logs.');
                }
                return of([] as JobLog[]);
              }),
              finalize(() => {
                this.loading.set(false);
                this.manualRefreshing.set(false);
              }),
            );
          }),
        ),
      ),
    ),
    { initialValue: [] as JobLog[] },
  );

  readonly formatDate = formatDateTime;

  constructor() {
    this.route.queryParamMap
      .pipe(
        map((qp) => qp.get('jobId') ?? ''),
        takeUntilDestroyed(),
      )
      .subscribe((queryJobId) => {
        this.jobFilter.set(queryJobId);
      });
  }

  onJobChange(value: string): void {
    this.jobFilter.set(value);
    this.page.set(0);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { jobId: value || null },
      queryParamsHandling: 'merge',
    });
  }

  onLevelChange(value: string): void {
    this.levelFilter.set(value);
    this.page.set(0);
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.page.set(0);
  }

  applyDateFilter(): void {
    const start = this.toApiDate(this.startDate());
    const end = this.toApiDate(this.endDate());
    if (!start || !end) {
      this.error.set('Select both start and end date/time.');
      return;
    }
    this.useDateFilter.set(true);
    this.page.set(0);
  }

  clearDateFilter(): void {
    this.useDateFilter.set(false);
    this.startDate.set('');
    this.endDate.set('');
    this.page.set(0);
  }

  refresh(): void {
    this.deleteMessage.set(null);
    this.manualRefreshing.set(true);
    this.refreshNonce.update((n) => n + 1);
  }

  isAllJobsView(): boolean {
    return !this.selectedJobId();
  }

  canDeleteInRange(): boolean {
    const jobId = this.selectedJobId();
    return (
      jobId != null &&
      !!this.toApiDate(this.startDate()) &&
      !!this.toApiDate(this.endDate()) &&
      !this.deleting()
    );
  }

  deleteLogsInRange(): void {
    this.error.set(null);
    this.deleteMessage.set(null);

    const jobId = this.selectedJobId();
    const start = this.toApiDate(this.startDate());
    const end = this.toApiDate(this.endDate());
    if (jobId == null || !start || !end) {
      this.error.set('Select a job and both start/end date/time before deleting.');
      return;
    }

    const label = this.selectedJobLabel();
    const from = this.formatDate(start);
    const to = this.formatDate(end);
    if (
      !window.confirm(
        `Delete all logs for ${label} from ${from} to ${to}?\n\nThis cannot be undone.`,
      )
    ) {
      return;
    }

    this.deleting.set(true);
    this.jobLogService
      .deleteByDateRange({ id: jobId, s: start, e: end })
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: (result) => {
          this.deleteMessage.set(`Deleted ${result.deleted} log(s).`);
          this.useDateFilter.set(true);
          this.page.set(0);
          this.refreshNonce.update((n) => n + 1);
        },
        error: (err: unknown) => {
          this.error.set(formatHttpError(err, 'Could not delete logs.'));
        },
      });
  }

  dismissDeleteMessage(): void {
    this.deleteMessage.set(null);
  }

  previousPage(): void {
    if (this.page() > 0) {
      this.page.update((p) => p - 1);
    }
  }

  nextPage(): void {
    if (this.logs().length >= this.pageSize) {
      this.page.update((p) => p + 1);
    }
  }

  selectedJobLabel(): string {
    const id = this.selectedJobId();
    if (id == null) {
      return 'All jobs';
    }
    const job = this.jobs().find((item) => item.id === id);
    if (!job) {
      return `#${id}`;
    }
    const name = job.name?.trim();
    return name ? `#${id} — ${name}` : `#${id}`;
  }

  jobLabelForLog(log: JobLog): string {
    const id = log.job_id;
    if (id == null) {
      return '—';
    }
    const job = this.jobs().find((item) => item.id === id);
    const name = job?.name?.trim();
    return name ? `#${id} — ${name}` : `#${id}`;
  }

  levelClass(level: string | null | undefined): string {
    const key = (level ?? '').trim().toUpperCase();
    switch (key) {
      case 'START':
        return 'log-level--start';
      case 'RUN':
        return 'log-level--run';
      case 'ERROR':
        return 'log-level--error';
      case 'COMPLETE':
        return 'log-level--complete';
      default:
        return '';
    }
  }

  rowClass(level: string | null | undefined): string {
    const key = (level ?? '').trim().toLowerCase();
    return key ? `log-row log-row--${key}` : 'log-row';
  }

  formatCount(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) {
      return '—';
    }
    return value.toLocaleString();
  }

  showingCountLabel(): string {
    const showing = this.logs().length;
    const stats = this.logStats();
    if (!stats) {
      return this.formatCount(showing);
    }
    if (this.useDateFilter() || stats.matching === stats.total) {
      return `${this.formatCount(showing)} of ${this.formatCount(stats.matching)}`;
    }
    const page = this.page();
    const from = page * this.pageSize + (showing > 0 ? 1 : 0);
    const to = page * this.pageSize + showing;
    if (showing === 0) {
      return `0 of ${this.formatCount(stats.matching)}`;
    }
    return `${this.formatCount(from)}–${this.formatCount(to)} of ${this.formatCount(stats.matching)}`;
  }

  private selectedJobId(): number | null {
    const trimmed = this.jobFilter().trim();
    if (!trimmed) {
      return null;
    }
    const id = Number(trimmed);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private buildSearchOption(
    jobId: string,
    level: string,
    search: string,
    useDateFilter: boolean,
    startDate: string,
    endDate: string,
  ): JobLogSearchOption | null {
    const jobIdNum = this.parseJobId(jobId);
    if (jobId.trim() && jobIdNum == null) {
      this.error.set('Invalid job id.');
      return null;
    }

    const option = {
      jobId: jobIdNum ?? undefined,
      search: search.trim(),
      level: level.trim() || undefined,
    };

    if (useDateFilter) {
      const start = this.toApiDate(startDate);
      const end = this.toApiDate(endDate);
      if (!start || !end) {
        this.error.set('Select both start and end date/time.');
        return null;
      }
      return { ...option, s: start, e: end };
    }

    return option;
  }

  private parseJobId(value: string): number | null {
    const trimmed = (value ?? '').trim();
    if (!trimmed) {
      return null;
    }
    const id = Number(trimmed);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private toApiDate(localValue: string): string | null {
    const trimmed = (localValue ?? '').trim();
    if (!trimmed) {
      return null;
    }
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  }
}
