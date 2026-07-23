import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { formatHttpError } from '../shared/format.util';
import { SystemConfigService } from './config.service';

interface ConfigTemplate {
  key: string;
  defaultValue: string;
  description: string;
}

const TEMPLATES: ConfigTemplate[] = [
  { key: 'joblog.max_per_job', defaultValue: '2000', description: 'Max in-memory log entries kept per job; oldest entries are dropped first.' },
  { key: 'joblog.max_total', defaultValue: '20000', description: 'Max in-memory log entries kept across all jobs; oldest entries are dropped first.' },
  { key: 'device-http.connect-timeout-ms', defaultValue: '5000', description: 'TCP connect timeout for http://device calls in milliseconds.' },
  { key: 'device-http.read-timeout-ms', defaultValue: '30000', description: 'Default read timeout for status/sensor JSON reads in milliseconds.' },
  { key: 'device-http.read-timeout-margin-ms', defaultValue: '15000', description: 'Extra read time added after device URL delay/wait in milliseconds.' },
  { key: 'device-http.min-read-timeout-ms', defaultValue: '5000', description: 'Minimum read timeout even when delay/wait are zero in milliseconds.' },
  { key: 'device-http.max-read-timeout-ms', defaultValue: '600000', description: 'Cap read timeout so a single call cannot block forever in milliseconds.' },
  { key: 'device-ip-scan.enabled', defaultValue: 'true', description: 'Enable or disable background IP scanning of devices.' },
  { key: 'device-ip-scan.file-path', defaultValue: '/app/ipt/network_scan.json', description: 'Path to JSON array file of { "mac", "ip" } mounted in the container.' },
  { key: 'device-ip-scan.interval-ms', defaultValue: '600000', description: 'Poll interval for device network scanning in milliseconds.' },
  { key: 'device-ip-scan.initial-delay-ms', defaultValue: '10000', description: 'Delay before the first scan starts on application boot.' },
  { key: 'fw.storage-dir', defaultValue: './data/fw', description: 'Directory path where firmware binary releases are stored.' },
  { key: 'schedule.timezone', defaultValue: 'Asia/Bangkok', description: 'IANA timezone for daily job execution windows (e.g. Asia/Bangkok).' },
  { key: 'security.jwt.secret', defaultValue: '', description: 'Key signature for signing JSON Web Tokens.' },
  { key: 'security.jwt.expiration-seconds', defaultValue: '86400', description: 'Expire time of user session tokens in seconds.' },
  { key: 'security.seed-admin', defaultValue: 'true', description: 'Automatically seed a default admin user if none exists.' },
  { key: 'security.admin.username', defaultValue: 'admin', description: 'Username of seeded administrator.' },
  { key: 'security.admin.password', defaultValue: 'admin', description: 'Password of seeded administrator.' },
];

@Component({
  selector: 'app-config-add-new',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './config-add-new.component.html',
  styleUrl: '../shared/crud-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigAddNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly configService = inject(SystemConfigService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly templates = TEMPLATES;

  readonly form = this.fb.group({
    cfgKey: ['', [Validators.required, Validators.pattern(/\S/)]],
    cfgValue: ['', [Validators.required]],
    description: [''],
  });

  selectTemplate(key: string): void {
    const tmpl = this.templates.find((t) => t.key === key);
    if (tmpl) {
      this.form.patchValue({
        cfgKey: tmpl.key,
        cfgValue: tmpl.defaultValue,
        description: tmpl.description,
      });
    }
  }

  submit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.configService
      .create({
        cfgKey: value.cfgKey ?? '',
        cfgValue: value.cfgValue ?? '',
        description: value.description ?? '',
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (created) => {
          void this.router.navigate(['/configs'], {
            queryParams: { created: created.id },
          });
        },
        error: (err: unknown) => {
          this.errorMessage.set(formatHttpError(err, 'Could not create configuration.'));
        },
      });
  }
}
