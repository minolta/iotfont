import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, of, startWith } from 'rxjs';

import { DeviceService } from '../device/device.service';
import { JobGroupService } from '../job-group/job-group.service';
import { JobTypeService } from '../job-type/job-type.service';
import { formatHttpError } from '../shared/format.util';
import { createPortFormGroup, readPortFormValues } from './job-port.form';
import { JobPortsSectionComponent } from './job-ports-section.component';
import { createPumpFormGroup, readPumpFormValues } from './job-pump.form';
import { JobPumpsSectionComponent } from './job-pumps-section.component';
import { createSensorFormGroup, readSensorFormValues } from './job-sensor.form';
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
  selector: 'app-job-add-new',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    JobPortsSectionComponent,
    JobPumpsSectionComponent,
    JobSensorsSectionComponent,
    JobTypeGuidePanelComponent,
  ],
  templateUrl: './job-add-new.component.html',
  styleUrl: '../shared/crud-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobAddNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly jobService = inject(JobService);
  private readonly deviceService = inject(DeviceService);
  private readonly jobTypeService = inject(JobTypeService);
  private readonly jobGroupService = inject(JobGroupService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

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
    deviceId: [this.initialDeviceId(), [Validators.required, Validators.min(1)]],
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

  submit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Please fill in all required fields.');
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.jobService
      .create({
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
        next: (created) => {
          void this.router.navigate(['/jobs'], {
            queryParams: { created: created.id },
          });
        },
        error: (err: unknown) => {
          this.errorMessage.set(formatHttpError(err, 'Could not create job.'));
        },
      });
  }

  private initialDeviceId(): number | '' {
    const id = Number(this.route.snapshot.queryParamMap.get('deviceId') ?? '');
    return Number.isFinite(id) && id > 0 ? id : '';
  }
}
