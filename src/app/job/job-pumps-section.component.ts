import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';

import type { Device } from '../device/device.model';

@Component({
  selector: 'app-job-pumps-section',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './job-pumps-section.component.html',
  styleUrls: ['./job-subsection.css', './job-pumps-section.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobPumpsSectionComponent {
  readonly devices = input.required<Device[]>();
  readonly pumps = input.required<FormArray>();
  readonly disabled = input(false);

  readonly addPump = output<void>();

  removePump(index: number): void {
    if (this.disabled()) {
      return;
    }
    this.pumps().removeAt(index);
  }
}
