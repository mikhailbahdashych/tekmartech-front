import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_PATHS } from '../../../core/constants/api-paths';
import { environment } from '../../../../environments/environment';
import {
  QueryResponse,
  QueryDetailResponse,
  QueryListResponse,
  QuerySubmitRequest,
} from '../models';

interface QueryListParams {
  status?: string;
  initiated_by?: string;
  limit?: number;
  cursor?: string;
}

@Injectable({ providedIn: 'root' })
export class QueryService {
  private http = inject(HttpClient);

  constructor(private api: ApiService) {}

  submitQuery(request: QuerySubmitRequest): Observable<{ query: QueryResponse }> {
    return this.api.post<{ query: QueryResponse }>(API_PATHS.QUERIES, request);
  }

  getQuery(id: string): Observable<{ query: QueryDetailResponse }> {
    return this.api.get<{ query: QueryDetailResponse }>(`${API_PATHS.QUERIES}/${id}`);
  }

  listQueries(params?: QueryListParams): Observable<QueryListResponse> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.initiated_by) httpParams = httpParams.set('initiated_by', params.initiated_by);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.cursor) httpParams = httpParams.set('cursor', params.cursor);

    return this.api.get<QueryListResponse>(API_PATHS.QUERIES, { params: httpParams });
  }

  approveQuery(id: string): Observable<{ query: QueryResponse }> {
    return this.api.post<{ query: QueryResponse }>(`${API_PATHS.QUERIES}/${id}/approve`);
  }

  rejectQuery(id: string): Observable<{ query: QueryResponse }> {
    return this.api.post<{ query: QueryResponse }>(`${API_PATHS.QUERIES}/${id}/reject`);
  }

  exportCsv(id: string): void {
    const url = `${environment.apiBaseUrl}${API_PATHS.QUERIES}/${id}/export/csv`;
    this.http.get(url, { responseType: 'blob', observe: 'response' }).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) return;

        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition
          ?.match(/filename="?([^";\s]+)"?/)?.[1]
          ?? `tekmar-query-${id}.csv`;

        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      },
    });
  }
}
