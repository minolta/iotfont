import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize, map, of, startWith, switchMap } from 'rxjs';

import { DeviceService } from '../device/device.service';
import { JobGroupService } from '../job-group/job-group.service';
import { JobTypeService } from '../job-type/job-type.service';
import { formatHttpError, toDatetimeLocalValue, toTimeInputValue } from '../shared/format.util';
import type { Job } from './job.model';
import { createPortFormGroup, jobPortsToFormValues, readPortFormValues } from './job-port.form';
import { JobPortsSectionComponent } from './job-ports-section.component';
import { createPumpFormGroup, jobPumpsToFormValues, readPumpFormValues } from './job-pump.form';
import { JobPumpsSectionComponent } from './job-pumps-section.component';
import { createSensorFormGroup, jobSensorsToFormValues, readSensorFormValues } from './job-sensor.form';
import { JobSensorsSectionComponent } from './job-sensors-section.component';
import {
  getJobTypeGuide,
  jobTypeUsesDescriptionSyntax,
  jobTypeUsesHumidityRange,
  jobTypeUsesTemperatureRange,
} from './job-type-guide';
import { JobTypeGuidePanelComponent } from './job-type-guide-panel.component';
import { JobService } from './job.service';

@Component({
  selector: 'app-job-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    JobPortsSectionComponent,
    JobPumpsSectionComponent,
    JobSensorsSectionComponent,
    JobTypeGuidePanelComponent,
  ],
  templateUrl: './job-edit.component.html',
  styleUrl: '../shared/crud-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobService = inject(JobService);
  private readonly deviceService = inject(DeviceService);
  private readonly jobTypeService = inject(JobTypeService);
  private readonly jobGroupService = inject(JobGroupService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly jobId = signal<number | null>(null);

  readonly devices = toSignal(
    this.deviceService.list().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  readonly jobTypes = toSignal(
    this.jobTypeService.list().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  readonly jobGroups = toSignal(
    this.jobGroupService.list().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    description: [''],
    deviceId: ['', [Validators.required, Validators.min(1)]],
    jobtypeId: ['', [Validators.required, Validators.min(1)]],
    jobGroupId: [''],
    enable: [true],
    enableLogs: [false],
    runtime: [''],
    waittime: [''],
    sdate: [''],
    edate: [''],
    stimes: [''],
    etimes: [''],
    hlow: [''],
    hhigh: [''],
    tlow: [''],
    thigh: [''],
    priority: ['0'],
    ports: this.fb.array([]),
    pumps: this.fb.array([]),
    sensors: this.fb.array([]),
  });

  private readonly selectedJobTypeId = toSignal(
    this.form.controls.jobtypeId.valueChanges.pipe(startWith(this.form.controls.jobtypeId.value)),
    { initialValue: this.form.controls.jobtypeId.value },
  );

  readonly selectedJobType = computed(() => {
    const id = Number(this.selectedJobTypeId());
    if (!Number.isFinite(id) || id <= 0) {
      return null;
    }
    return this.jobTypes().find((jobType) => jobType.id === id) ?? null;
  });

  readonly selectedJobTypeGuide = computed(() => {
    const jobType = this.selectedJobType();
    return jobType ? getJobTypeGuide(jobType.name) : null;
  });

  readonly selectedJobTypeName = computed(() => {
    const jobType = this.selectedJobType();
    return jobType?.name?.trim() || (jobType ? `#${jobType.id}` : '');
  });

  readonly showHumidityRange = computed(() => jobTypeUsesHumidityRange(this.selectedJobType()?.name));

  readonly showTemperatureRange = computed(() => jobTypeUsesTemperatureRange(this.selectedJobType()?.name));

  readonly descriptionSyntaxHint = computed(() => {
    const jobType = this.selectedJobType();
    if (!jobType || !jobTypeUsesDescriptionSyntax(jobType.name)) {
      return null;
    }
    const examples = getJobTypeGuide(jobType.name).descriptionExamples;
    return examples?.length ? `ตัวอย่าง Description: ${examples.join(' · ')}` : null;
  });

  get portsFormArray(): FormArray {
    return this.form.controls.ports;
  }

  get pumpsFormArray(): FormArray {
    return this.form.controls.pumps;
  }

  get sensorsFormArray(): FormArray {
    return this.form.controls.sensors;
  }

  addPortRow(): void {
    const deviceId = Number(this.form.controls.deviceId.value);
    this.portsFormArray.push(
      createPortFormGroup(this.fb, undefined, Number.isFinite(deviceId) && deviceId > 0 ? deviceId : null),
    );
  }

  addPumpRow(): void {
    const deviceId = Number(this.form.controls.deviceId.value);
    this.pumpsFormArray.push(
      createPumpFormGroup(this.fb, undefined, Number.isFinite(deviceId) && deviceId > 0 ? deviceId : null),
    );
  }

  addSensorRow(): void {
    const deviceId = Number(this.form.controls.deviceId.value);
    this.sensorsFormArray.push(
      createSensorFormGroup(this.fb, undefined, Number.isFinite(deviceId) && deviceId > 0 ? deviceId : null),
    );
  }

  constructor() {
    this.route.paramMap
      .pipe(
        map((pm) => Number(pm.get('id') ?? '')),
        switchMap((id) => {
          if (!Number.isFinite(id) || id < 1) {
            this.loading.set(false);
            this.loadError.set('Invalid job ID.');
            this.jobId.set(null);
            return EMPTY;
          }
          this.jobId.set(id);
          this.loading.set(true);
          this.loadError.set(null);
          return this.jobService.getById(id).pipe(
            catchError(() => {
              this.loadError.set('Could not load job.');
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((job: Job | undefined) => {
        if (!job) {
          if (!this.loadError()) {
            this.loadError.set('Job not found.');
          }
          return;
        }
        this.form.patchValue({
          name: job.name ?? '',
          description: job.description ?? '',
          deviceId: String(job.device_id ?? job.device?.id ?? ''),
          jobtypeId: String(job.jobtype_id ?? job.jobtype?.id ?? ''),
          jobGroupId: String(job.jobgroup_id ?? job.jobgroup?.id ?? ''),
          enable: job.enable ?? true,
          enableLogs: job.enable_logs ?? false,
          runtime: job.runtime != null ? String(job.runtime) : '',
          waittime: job.waittime != null ? String(job.waittime) : '',
          sdate: toDatetimeLocalValue(job.sdate),
          edate: toDatetimeLocalValue(job.edate),
          stimes: toTimeInputValue(job.stimes),
          etimes: toTimeInputValue(job.etimes),
          hlow: job.hlow != null ? String(job.hlow) : '',
          hhigh: job.hhigh != null ? String(job.hhigh) : '',
          tlow: job.tlow != null ? String(job.tlow) : '',
          thigh: job.thigh != null ? String(job.thigh) : '',
          priority: job.priority != null ? String(job.priority) : '0',
        });
        this.setPortsFromJob(job);
        this.setPumpsFromJob(job);
        this.setSensorsFromJob(job);
      });
  }

  private setPortsFromJob(job: Job): void {
    this.portsFormArray.clear();
    const defaultDeviceId = job.device_id ?? job.device?.id ?? null;
    for (const port of jobPortsToFormValues(job.ports)) {
      this.portsFormArray.push(createPortFormGroup(this.fb, port, defaultDeviceId));
    }
  }

  private setPumpsFromJob(job: Job): void {
    this.pumpsFormArray.clear();
    const defaultDeviceId = job.device_id ?? job.device?.id ?? null;
    for (const pump of jobPumpsToFormValues(job)) {
      this.pumpsFormArray.push(createPumpFormGroup(this.fb, pump, defaultDeviceId));
    }
  }

  private setSensorsFromJob(job: Job): void {
    this.sensorsFormArray.clear();
    const defaultDeviceId = job.device_id ?? job.device?.id ?? null;
    for (const sensor of jobSensorsToFormValues(job.sensors)) {
      this.sensorsFormArray.push(createSensorFormGroup(this.fb, sensor, defaultDeviceId));
    }
  }

  submit(): void {
    this.saveError.set(null);
    const id = this.jobId();
    if (id == null || this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.invalid) {
        this.saveError.set('Please fill in all required fields.');
      }
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.jobService
      .update(id, {
        name: value.name ?? '',
        description: value.description ?? '',
        deviceId: Number(value.deviceId),
        jobtypeId: Number(value.jobtypeId),
        jobGroupId: value.jobGroupId ? Number(value.jobGroupId) : null,
        enable: !!value.enable,
        enableLogs: !!value.enableLogs,
        runtime: value.runtime ?? '',
        waittime: value.waittime ?? '',
        sdate: value.sdate ?? '',
        edate: value.edate ?? '',
        stimes: value.stimes ?? '',
        etimes: value.etimes ?? '',
        hlow: value.hlow ?? '',
        hhigh: value.hhigh ?? '',
        tlow: value.tlow ?? '',
        thigh: value.thigh ?? '',
        priority: value.priority ?? '0',
        ports: readPortFormValues(this.portsFormArray.getRawValue()),
        pumps: readPumpFormValues(this.pumpsFormArray.getRawValue()),
        sensors: readSensorFormValues(this.sensorsFormArray.getRawValue()),
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/jobs'], {
            queryParams: { updated: id },
          });
        },
        error: (err: unknown) => {
          this.saveError.set(formatHttpError(err, 'Could not save job.'));
        },
      });
  }
}
