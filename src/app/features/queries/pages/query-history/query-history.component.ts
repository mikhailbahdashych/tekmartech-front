import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';
import { QueryService } from '../../services/query.service';
import { QueryResponse, PaginationResponse } from '../../models';
import { QUERY_STATUS_CONFIG, QUERY_STATUS_OPTIONS } from '../../constants/query-status';
import { IntegrationService } from '../../../integrations/services/integration.service';

@Component({
  selector: 'app-query-history',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    StatusBadgeComponent,
    PaginationComponent,
    RelativeTimePipe,
  ],
  templateUrl: './query-history.component.html',
  styleUrl: './query-history.component.scss',
})
export class QueryHistoryComponent implements OnInit {
  private queryService = inject(QueryService);
  private integrationService = inject(IntegrationService);
  private router = inject(Router);

  readonly queries = signal<QueryResponse[]>([]);
  readonly pagination = signal<PaginationResponse | null>(null);
  readonly isLoading = signal(false);
  readonly statusFilter = signal<string>('');
  readonly integrationNames = signal<Map<string, string>>(new Map());

  readonly statusConfig = QUERY_STATUS_CONFIG;
  readonly statusOptions = QUERY_STATUS_OPTIONS;

  ngOnInit(): void {
    this.loadQueries();
    this.loadIntegrationNames();
  }

  getIntegrationLabel(id: string): string {
    return this.integrationNames().get(id) ?? id.substring(0, 8) + '... (disconnected)';
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.queries.set([]);
    this.pagination.set(null);
    this.loadQueries();
  }

  loadMore(): void {
    const cursor = this.pagination()?.next_cursor;
    if (!cursor) return;
    this.loadQueries(cursor);
  }

  navigateToQuery(query: QueryResponse): void {
    this.router.navigate(['/queries', query.id]);
  }

  truncateText(text: string, maxLength: number = 80): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  private loadQueries(cursor?: string): void {
    this.isLoading.set(true);
    const params: Record<string, string | number> = {};
    if (this.statusFilter()) params['status'] = this.statusFilter();
    if (cursor) params['cursor'] = cursor;

    this.queryService.listQueries(params).subscribe({
      next: (response) => {
        if (cursor) {
          this.queries.update(existing => [...existing, ...response.queries]);
        } else {
          this.queries.set(response.queries);
        }
        this.pagination.set(response.pagination);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  private loadIntegrationNames(): void {
    this.integrationService.listIntegrations({ limit: 100 }).subscribe({
      next: (response) => {
        const map = new Map<string, string>();
        for (const integration of response.integrations) {
          map.set(integration.id, integration.display_name);
        }
        this.integrationNames.set(map);
      },
    });
  }
}
