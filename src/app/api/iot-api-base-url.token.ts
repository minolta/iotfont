import { InjectionToken } from '@angular/core';

/** Origin of the IoT backend (no trailing slash), e.g. `http://localhost:8080`. */
export const IOT_API_BASE_URL = new InjectionToken<string>('IOT_API_BASE_URL', {
  factory: () => 'http://localhost:8080',
});
