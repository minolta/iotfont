import { InjectionToken } from '@angular/core';

/** Origin of the IoT backend (no trailing slash). Empty = same-origin `/rest/...`. */
export const IOT_API_BASE_URL = new InjectionToken<string>('IOT_API_BASE_URL', {
  factory: () => '',
});
