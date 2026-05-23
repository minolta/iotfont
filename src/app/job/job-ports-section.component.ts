import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';

import type { Device } from '../device/device.model';
import { JOB_PORT_LOGIC_OPTIONS } from './job-port.model';

@Component({
  selector: 'app-job-ports-section',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './job-ports-section.component.html',
  styleUrls: ['./job-subsection.css', './job-ports-section.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobPortsSectionComponent {
  readonly devices = input.required<Device[]>();
  readonly ports = input.required<FormArray>();
  readonly disabled = input(false);

  readonly addPort = output<void>();

  readonly logicOptions = JOB_PORT_LOGIC_OPTIONS;

  removePort(index: number): void {
    if (this.disabled()) {
      return;
    }
    this.ports().removeAt(index);
  }
}
