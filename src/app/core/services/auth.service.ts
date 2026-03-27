import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, of, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { API_PATHS } from '../constants/api-paths';
import {
  User,
  Organization,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshResponse,
  AcceptInvitationRequest,
} from '../models';

const USER_CACHE_KEY = 'tekmar_user_cache';
const ORG_CACHE_KEY = 'tekmar_org_cache';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken: string | null = null;

  readonly isAuthenticated = signal(false);
  readonly currentUser = signal<User | null>(null);
  readonly currentOrganization = signal<Organization | null>(null);

  // Refresh coordination for the interceptor
  private _isRefreshing = false;
  private _refreshSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  getAccessToken(): string | null {
    return this.accessToken;
  }

  get isRefreshing(): boolean {
    return this._isRefreshing;
  }

  get refreshSubject(): BehaviorSubject<string | null> {
    return this._refreshSubject;
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>(API_PATHS.AUTH.REGISTER, request, {
      withCredentials: true,
    }).pipe(
      tap(response => this.handleAuthResponse(response)),
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>(API_PATHS.AUTH.LOGIN, request, {
      withCredentials: true,
    }).pipe(
      tap(response => this.handleAuthResponse(response)),
    );
  }

  acceptInvitation(request: AcceptInvitationRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>(`${API_PATHS.INVITATIONS}/accept`, request, {
      withCredentials: true,
    }).pipe(
      tap(response => this.handleAuthResponse(response)),
    );
  }

  silentRefresh(): Observable<RefreshResponse> {
    return this.api.post<RefreshResponse>(API_PATHS.AUTH.REFRESH, null, {
      withCredentials: true,
    }).pipe(
      tap(response => {
        this.accessToken = response.access_token;
        this.isAuthenticated.set(true);
      }),
    );
  }

  logout(): void {
    this.api.post(API_PATHS.AUTH.LOGOUT, null, {
      withCredentials: true,
    }).pipe(
      catchError(() => of(null)),
    ).subscribe(() => {
      this.clearAuthState();
      this.router.navigate(['/login']);
    });
  }

  async initializeAuth(): Promise<void> {
    try {
      const response = await firstValueFrom(this.silentRefresh());
      this.hydrateUserFromCache();
    } catch {
      this.clearAuthState();
    }
  }

  // Called by the interceptor when a refresh attempt starts
  startRefresh(): void {
    this._isRefreshing = true;
    this._refreshSubject = new BehaviorSubject<string | null>(null);
  }

  // Called by the interceptor when the refresh succeeds
  completeRefresh(token: string): void {
    this._isRefreshing = false;
    this._refreshSubject.next(token);
    this._refreshSubject.complete();
  }

  // Called by the interceptor when the refresh fails
  failRefresh(): void {
    this._isRefreshing = false;
    this._refreshSubject.error('Refresh failed');
    this.clearAuthState();
  }

  private handleAuthResponse(response: AuthResponse): void {
    this.accessToken = response.access_token;
    this.isAuthenticated.set(true);
    this.currentUser.set(response.user);
    this.currentOrganization.set(response.organization);
    this.cacheUserData(response.user, response.organization);
  }

  private clearAuthState(): void {
    this.accessToken = null;
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.currentOrganization.set(null);
    sessionStorage.removeItem(USER_CACHE_KEY);
    sessionStorage.removeItem(ORG_CACHE_KEY);
  }

  private cacheUserData(user: User, organization: Organization): void {
    try {
      sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      sessionStorage.setItem(ORG_CACHE_KEY, JSON.stringify(organization));
    } catch {
      // sessionStorage unavailable — not critical
    }
  }

  private hydrateUserFromCache(): void {
    try {
      const userJson = sessionStorage.getItem(USER_CACHE_KEY);
      const orgJson = sessionStorage.getItem(ORG_CACHE_KEY);
      if (userJson) {
        this.currentUser.set(JSON.parse(userJson) as User);
      }
      if (orgJson) {
        this.currentOrganization.set(JSON.parse(orgJson) as Organization);
      }
    } catch {
      // Cache parse failure — not critical, user data unavailable until next login
    }
  }
}
