import { Routes } from '@angular/router';

export const QUERIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/queries-placeholder/queries-placeholder.component')
      .then(m => m.QueriesPlaceholderComponent),
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
