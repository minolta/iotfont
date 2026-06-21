import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, finalize, of, switchMap } from 'rxjs';

import { formatHttpError } from '../shared/format.util';

import type { FwRelease } from './firmware.model';
import { FirmwareService } from './firmware.service';

@Component({
  selector: 'app-firmware-upload',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './firmware-upload.component.html',
  styleUrl: './firmware-upload.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FirmwareUploadComponent implements OnInit {
  private readonly firmwareService = inject(FirmwareService);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fwFile');

  readonly appName = signal('');
  readonly version = signal('');
  readonly selectedFile = signal<File | null>(null);
  readonly submitting = signal(false);
  readonly loadingList = signal(false);
  readonly checkingLatest = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly versionIssue = signal<string | null>(null);
  readonly uploadResult = signal<FwRelease | null>(null);
  readonly latestRelease = signal<FwRelease | null>(null);
  readonly releases = signal<FwRelease[]>([]);
  readonly searchTerm = signal('');

  constructor() {
    toObservable(this.appName)
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((name) => {
          const trimmed = name.trim();
          if (!trimmed) {
            this.latestRelease.set(null);
            this.validateVersion();
            return of(null);
          }
          this.checkingLatest.set(true);
          return this.firmwareService.getLastVersion(trimmed).pipe(
            catchError(() => of({ ver: 0 } as FwRelease)),
            finalize(() => this.checkingLatest.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((release) => {
        this.latestRelease.set(release);
        this.validateVersion();
      });
  }

  ngOnInit(): void {
    this.loadReleases();
  }

  onAppNameInput(value: string): void {
    this.appName.set(value);
    this.errorMessage.set(null);
  }

  onVersionInput(value: string): void {
    this.version.set(value);
    this.errorMessage.set(null);
    this.validateVersion();
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.errorMessage.set(null);
    this.uploadResult.set(null);
  }

  suggestedVersion(): number | null {
    const latest = this.latestRelease()?.ver ?? 0;
    if (this.checkingLatest() || !this.appName().trim()) {
      return null;
    }
    return latest + 1;
  }

  submit(): void {
    this.errorMessage.set(null);
    this.uploadResult.set(null);
    this.validateVersion();

    const name = this.appName().trim();
    if (!name) {
      this.errorMessage.set('App name is required (device firmware type).');
      return;
    }

    const verText = this.version().trim();
    const ver = Number.parseInt(verText, 10);
    if (!verText || Number.isNaN(ver) || ver < 0) {
      this.errorMessage.set('Version must be a non-negative integer.');
      return;
    }

    if (this.versionIssue()) {
      this.errorMessage.set(this.versionIssue());
      return;
    }

    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set('Select a firmware binary file.');
      return;
    }

    this.submitting.set(true);
    this.firmwareService
      .upload(name, ver, file)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (release) => {
          this.uploadResult.set(release);
          this.latestRelease.set(release);
          this.clearSelectedFile();
          const uploadedVer = release.ver ?? ver;
          this.version.set(String(uploadedVer + 1));
          this.loadReleases();
          this.validateVersion();
        },
        error: (err: unknown) => {
          this.errorMessage.set(formatHttpError(err, 'Could not upload firmware.'));
        },
      });
  }

  applySearch(): void {
    this.loadReleases(this.searchTerm().trim());
  }

  private clearSelectedFile(): void {
    this.selectedFile.set(null);
    const input = this.fileInput()?.nativeElement;
    if (input) {
      input.value = '';
    }
  }

  private validateVersion(): void {
    const verText = this.version().trim();
    if (!verText) {
      this.versionIssue.set(null);
      return;
    }

    const ver = Number.parseInt(verText, 10);
    if (Number.isNaN(ver) || ver < 0) {
      this.versionIssue.set('Version must be a non-negative integer.');
      return;
    }

    const latest = this.latestRelease()?.ver ?? 0;
    if (ver <= latest) {
      this.versionIssue.set(
        latest > 0
          ? `Version must be higher than the latest on server (${latest}).`
          : 'Version must be greater than 0 for the first upload.',
      );
      return;
    }

    this.versionIssue.set(null);
  }

  private loadReleases(search = ''): void {
    this.loadingList.set(true);
    this.firmwareService
      .search({ search, page: 0, limit: 100 })
      .pipe(finalize(() => this.loadingList.set(false)))
      .subscribe({
        next: (items) => this.releases.set(items),
        error: () => this.releases.set([]),
      });
  }
}
