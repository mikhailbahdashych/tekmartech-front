import { Routes } from '@angular/router';

export const QUERIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./queries-list/queries-list.component')
      .then(m => m.QueriesListComponent),
  },
];
