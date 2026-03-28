import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { API_PATHS } from '@core/constants/api-paths';
import { User } from '@core/models';
import { InvitationResponse, InvitationListResponse, UserListResponse } from '@features/users/models/user-management.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private api: ApiService) {}

  listUsers(params?: { role?: string; status?: string; limit?: number; cursor?: string }): Observable<UserListResponse> {
    let httpParams = new HttpParams();
    if (params?.role) httpParams = httpParams.set('role', params.role);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.cursor) httpParams = httpParams.set('cursor', params.cursor);
    return this.api.get<UserListResponse>(API_PATHS.USERS, { params: httpParams });
  }

  removeUser(userId: string): Observable<void> {
    return this.api.delete<void>(`${API_PATHS.USERS}/${userId}`);
  }

  changeRole(userId: string, role: string): Observable<{ user: User }> {
    return this.api.patch<{ user: User }>(`${API_PATHS.USERS}/${userId}/role`, { role });
  }

  inviteUser(email: string, role: string): Observable<{ invitation: InvitationResponse }> {
    return this.api.post<{ invitation: InvitationResponse }>(`${API_PATHS.USERS}/invite`, { email, role });
  }

  listInvitations(params?: { status?: string; limit?: number; cursor?: string }): Observable<InvitationListResponse> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.cursor) httpParams = httpParams.set('cursor', params.cursor);
    return this.api.get<InvitationListResponse>(API_PATHS.INVITATIONS, { params: httpParams });
  }

  revokeInvitation(invitationId: string): Observable<{ invitation: InvitationResponse }> {
    return this.api.post<{ invitation: InvitationResponse }>(`${API_PATHS.INVITATIONS}/${invitationId}/revoke`);
  }
}
