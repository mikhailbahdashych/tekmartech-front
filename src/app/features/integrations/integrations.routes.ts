import { Routes } from '@angular/router';

export const INTEGRATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/integration-list/integration-list.component')
      .then(m => m.IntegrationListComponent),
  },
];
