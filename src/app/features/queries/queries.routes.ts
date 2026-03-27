import { Routes } from '@angular/router';

export const QUERIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/query-page/query-page.component')
      .then(m => m.QueryPageComponent),
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/query-history/query-history.component')
      .then(m => m.QueryHistoryComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/query-detail/query-detail.component')
      .then(m => m.QueryDetailComponent),
  },
];
