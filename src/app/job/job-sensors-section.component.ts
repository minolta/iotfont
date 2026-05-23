import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';

import type { Device } from '../device/device.model';
import { JOB_SENSOR_TYPE_OPTIONS } from './job-sensor.model';

@Component({
  selector: 'app-job-sensors-section',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './job-sensors-section.component.html',
  styleUrls: ['./job-subsection.css', './job-sensors-section.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobSensorsSectionComponent {
  readonly devices = input.required<Device[]>();
  readonly sensors = input.required<FormArray>();
  readonly disabled = input(false);

  readonly addSensor = output<void>();

  readonly sensorTypeOptions = JOB_SENSOR_TYPE_OPTIONS;

  removeSensor(index: number): void {
    if (this.disabled()) {
      return;
    }
    this.sensors().removeAt(index);
  }
}
