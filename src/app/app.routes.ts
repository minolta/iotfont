import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'devices' },
  {
    path: 'devices/new',
    loadComponent: () =>
      import('./device/device-add-new.component').then((m) => m.DeviceAddNewComponent),
  },
  {
    path: 'devices/import',
    loadComponent: () =>
      import('./device/device-import.component').then((m) => m.DeviceImportComponent),
  },
  {
    path: 'devices/:id/edit',
    loadComponent: () =>
      import('./device/device-edit.component').then((m) => m.DeviceEditComponent),
  },
  {
    path: 'devices/:id/humidity',
    loadComponent: () =>
      import('./humidity/device-humidity.component').then((m) => m.DeviceHumidityComponent),
  },
  {
    path: 'devices/info',
    loadComponent: () =>
      import('./device/device-info.component').then((m) => m.DeviceInfoComponent),
  },
  { path: 'devices/:id/info', redirectTo: 'devices/info', pathMatch: 'full' },
  {
    path: 'devices',
    loadComponent: () =>
      import('./device/device-list.component').then((m) => m.DeviceListComponent),
  },
  {
    path: 'job-groups/new',
    loadComponent: () =>
      import('./job-group/job-group-add-new.component').then((m) => m.JobGroupAddNewComponent),
  },
  {
    path: 'job-groups/:id/edit',
    loadComponent: () =>
      import('./job-group/job-group-edit.component').then((m) => m.JobGroupEditComponent),
  },
  {
    path: 'job-groups',
    loadComponent: () =>
      import('./job-group/job-group-list.component').then((m) => m.JobGroupListComponent),
  },
  {
    path: 'job-types/new',
    loadComponent: () =>
      import('./job-type/job-type-add-new.component').then((m) => m.JobTypeAddNewComponent),
  },
  {
    path: 'job-types/:id/edit',
    loadComponent: () =>
      import('./job-type/job-type-edit.component').then((m) => m.JobTypeEditComponent),
  },
  {
    path: 'job-types',
    loadComponent: () =>
      import('./job-type/job-type-list.component').then((m) => m.JobTypeListComponent),
  },
  {
    path: 'jobs/new',
    loadComponent: () => import('./job/job-add-new.component').then((m) => m.JobAddNewComponent),
  },
  {
    path: 'jobs/import',
    loadComponent: () =>
      import('./job/job-import.component').then((m) => m.JobImportComponent),
  },
  {
    path: 'jobs/:id/edit',
    loadComponent: () => import('./job/job-edit.component').then((m) => m.JobEditComponent),
  },
  {
    path: 'jobs',
    loadComponent: () => import('./job/job-list.component').then((m) => m.JobListComponent),
  },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./task/task-running.component').then((m) => m.TaskRunningComponent),
  },
];
