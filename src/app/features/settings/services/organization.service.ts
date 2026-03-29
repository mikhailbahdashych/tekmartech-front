import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { API_PATHS } from '@core/constants/api-paths';
import { Organization } from '@core/models';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  constructor(private api: ApiService) {}

  getOrganization(): Observable<{ organization: Organization }> {
    return this.api.get<{ organization: Organization }>(API_PATHS.ORGANIZATION);
  }

  updateOrganization(name: string): Observable<{ organization: Organization }> {
    return this.api.patch<{ organization: Organization }>(API_PATHS.ORGANIZATION, { name });
  }
}
