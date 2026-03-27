import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_PATHS } from '../../../core/constants/api-paths';
import { ActivityLogListResponse } from '../models/activity-log.model';

@Injectable({ providedIn: 'root' })
export class ActivityLogService {
  constructor(private api: ApiService) {}

  listActivityLogs(params?: { action?: string; user_id?: string; limit?: number; cursor?: string }): Observable<ActivityLogListResponse> {
    let httpParams = new HttpParams();
    if (params?.action) httpParams = httpParams.set('action', params.action);
    if (params?.user_id) httpParams = httpParams.set('user_id', params.user_id);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.cursor) httpParams = httpParams.set('cursor', params.cursor);
    return this.api.get<ActivityLogListResponse>(API_PATHS.ACTIVITY_LOGS, { params: httpParams });
  }
}
