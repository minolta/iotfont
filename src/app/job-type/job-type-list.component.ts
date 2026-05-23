import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, finalize, map, of, switchMap, timer } from 'rxjs';

import { displayValue, formatHttpError } from '../shared/format.util';
import type { JobType } from './job-type.model';
import { JobTypeService } from './job-type.service';

@Component({
  selector: 'app-job-type-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './job-type-list.component.html',
  styleUrl: '../shared/crud-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobTypeListComponent {
  private readonly jobTypeService = inject(JobTypeService);
  private readonly route = inject(ActivatedRoute);

  readonly createdId = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('created'))),
    { initialValue: null as string | null },
  );

  readonly updatedId = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('updated'))),
    { initialValue: null as string | null },
  );

  readonly searchTerm = signal('');
  readonly refreshNonce = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deletingId = signal<number | null>(null);
  readonly deleteError = signal<string | null>(null);

  readonly jobTypes = toSignal(
    combineLatest([toObservable(this.searchTerm), toObservable(this.refreshNonce)]).pipe(
      switchMap(([q]) => {
        this.loading.set(true);
        this.error.set(null);
        const trimmed = q.trim();
        const request$ = trimmed
          ? this.jobTypeService.search({ search: trimmed, page: 0, limit: 50 })
          : this.jobTypeService.list();
        return timer(trimmed ? 300 : 0).pipe(
          switchMap(() =>
            request$.pipe(
              catchError(() => {
                this.error.set('Could not load job types.');
                return of([] as JobType[]);
              }),
              finalize(() => this.loading.set(false)),
            ),
          ),
        );
      }),
    ),
    { initialValue: [] as JobType[] },
  );

  readonly displayValue = displayValue;

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  deleteJobType(item: JobType): void {
    this.deleteError.set(null);
    const label = item.name?.trim() || `#${item.id}`;
    if (!window.confirm(`Delete job type "${label}"?`)) {
      return;
    }
    this.deletingId.set(item.id);
    this.jobTypeService
      .delete(item.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => this.refreshNonce.update((n) => n + 1),
        error: (err: unknown) => {
          this.deleteError.set(formatHttpError(err, 'Could not delete job type.'));
        },
      });
  }
}
