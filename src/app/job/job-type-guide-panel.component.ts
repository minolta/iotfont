import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { JobTypeGuide } from './job-type-guide';

@Component({
  selector: 'app-job-type-guide-panel',
  standalone: true,
  template: `
    @if (guide(); as g) {
      <section class="job-type-guide-section" [attr.aria-labelledby]="headingId()">
        <h2 [id]="headingId()">
          Job type: <code>{{ jobTypeName() }}</code>
        </h2>
        <p class="job-type-guide-summary">{{ g.summary }}</p>

        <dl class="job-type-guide-details">
          <div>
            <dt>ทำงานอย่างไร</dt>
            <dd>{{ g.howItWorks }}</dd>
          </div>
          <div>
            <dt>ต้องตั้งค่า</dt>
            <dd>
              <ul>
                @for (item of g.requiredFields; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
            </dd>
          </div>
          <div>
            <dt>ตัวเลือกเพิ่มเติม</dt>
            <dd>
              <ul>
                @for (item of g.optionalFields; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
            </dd>
          </div>
          @if (g.descriptionOptions?.length) {
            <div>
              <dt>รูปแบบ Description</dt>
              <dd>
                <ul>
                  @for (item of g.descriptionOptions; track item) {
                    <li>{{ item }}</li>
                  }
                </ul>
                @if (g.descriptionExamples?.length) {
                  <p class="job-type-guide-examples">
                    ตัวอย่าง:
                    @for (example of g.descriptionExamples; track example; let last = $last) {
                      <code>{{ example }}</code>@if (!last) {<span> · </span>}
                    }
                  </p>
                }
              </dd>
            </div>
          }
        </dl>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobTypeGuidePanelComponent {
  readonly guide = input<JobTypeGuide | null>(null);
  readonly jobTypeName = input.required<string>();
  readonly headingId = input('job-type-guide-heading');
}
