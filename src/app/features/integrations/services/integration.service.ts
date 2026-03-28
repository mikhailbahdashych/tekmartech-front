import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { API_PATHS } from '@core/constants/api-paths';
import {
  IntegrationResponse,
  IntegrationListResponse,
  ConnectIntegrationPayload,
} from '../models';

interface ListParams {
  type?: string;
  status?: string;
  limit?: number;
  cursor?: string;
}

@Injectable({ providedIn: 'root' })
export class IntegrationService {
  constructor(private api: ApiService) {}

  listIntegrations(params?: ListParams): Observable<IntegrationListResponse> {
    let httpParams = new HttpParams();
    if (params?.type) httpParams = httpParams.set('type', params.type);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.cursor) httpParams = httpParams.set('cursor', params.cursor);

    return this.api.get<IntegrationListResponse>(API_PATHS.INTEGRATIONS, { params: httpParams });
  }

  connectIntegration(payload: ConnectIntegrationPayload): Observable<{ integration: IntegrationResponse }> {
    return this.api.post<{ integration: IntegrationResponse }>(API_PATHS.INTEGRATIONS, payload);
  }

  disconnectIntegration(id: string): Observable<void> {
    return this.api.delete<void>(`${API_PATHS.INTEGRATIONS}/${id}`);
  }

  testIntegration(id: string): Observable<{ integration: IntegrationResponse }> {
    return this.api.post<{ integration: IntegrationResponse }>(`${API_PATHS.INTEGRATIONS}/${id}/test`);
  }
}
