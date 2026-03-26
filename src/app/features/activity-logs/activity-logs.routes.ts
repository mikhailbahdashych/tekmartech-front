import { Routes } from '@angular/router';

export const ACTIVITY_LOGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./activity-logs-list/activity-logs-list.component')
      .then(m => m.ActivityLogsListComponent),
  },
];
