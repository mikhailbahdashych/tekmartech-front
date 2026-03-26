import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, switchMap, catchError, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AUTH_EXCLUSION_PATHS } from '../constants/api-paths';

function isExcludedPath(url: string): boolean {
  return AUTH_EXCLUSION_PATHS.some(path => url.includes(path));
}

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (isExcludedPath(req.url)) {
    return next(req);
  }

  const token = authService.getAccessToken();
  const request = token ? addToken(req, token) : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      return handle401(req, next, authService, router);
    }),
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router,
): Observable<any> {
  if (authService.isRefreshing) {
    // Another request already triggered refresh — wait for it
    return authService.refreshSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap(token => next(addToken(req, token))),
    );
  }

  // This is the first 401 — initiate refresh
  authService.startRefresh();

  return authService.silentRefresh().pipe(
    switchMap(response => {
      authService.completeRefresh(response.access_token);
      return next(addToken(req, response.access_token));
    }),
    catchError(err => {
      authService.failRefresh();
      router.navigate(['/login']);
      return throwError(() => err);
    }),
  );
}
