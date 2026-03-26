import { Routes } from '@angular/router';

export const INTEGRATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./integrations-list/integrations-list.component')
      .then(m => m.IntegrationsListComponent),
  },
];
