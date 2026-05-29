import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { IOT_API_BASE_URL } from './api/iot-api-base-url.token';
import { authInterceptor } from './auth/auth.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    // Same-origin /rest — proxied by nginx (Docker) or proxy.conf.json (ng serve).
    { provide: IOT_API_BASE_URL, useValue: '' },
  ],
};
