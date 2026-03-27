import { Routes } from '@angular/router';

export const ACTIVITY_LOGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/activity-log-list/activity-log-list.component')
      .then(m => m.ActivityLogListComponent),
  },
];
