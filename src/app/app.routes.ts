import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component')
      .then(m => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'invitations/accept',
    loadComponent: () => import('./features/auth/invitation-accept/invitation-accept.component')
      .then(m => m.InvitationAcceptComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component')
      .then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'new',
        loadComponent: () => import('./features/queries/pages/query-page/query-page.component')
          .then(m => m.QueryPageComponent),
      },
      {
        path: 'queries',
        loadChildren: () => import('./features/queries/queries.routes')
          .then(m => m.QUERIES_ROUTES),
      },
      {
        path: 'integrations',
        loadChildren: () => import('./features/integrations/integrations.routes')
          .then(m => m.INTEGRATIONS_ROUTES),
        canActivate: [adminGuard],
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes')
          .then(m => m.USERS_ROUTES),
        canActivate: [adminGuard],
      },
      {
        path: 'activity-logs',
        loadChildren: () => import('./features/activity-logs/activity-logs.routes')
          .then(m => m.ACTIVITY_LOGS_ROUTES),
        canActivate: [adminGuard],
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes')
          .then(m => m.SETTINGS_ROUTES),
        canActivate: [adminGuard],
      },
      { path: '', redirectTo: 'new', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
