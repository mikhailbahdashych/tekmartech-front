import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TkBadgeComponent, TkBadgeVariant } from '@shared/components/tk-badge/tk-badge.component';
import { TkPaginationComponent } from '@shared/components/tk-pagination/tk-pagination.component';
import { TkSpinnerComponent } from '@shared/components/tk-spinner/tk-spinner.component';
import { TkSelectComponent, TkSelectOption } from '@shared/components/tk-select/tk-select.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { QueryService } from '@features/queries/services/query.service';
import { QueryResponse, QueryStatus, PaginationResponse } from '@features/queries/models';
import { QUERY_STATUS_OPTIONS } from '@features/queries/constants/query-status';
import { IntegrationService } from '@features/integrations/services/integration.service';

const STATUS_VARIANT_MAP: Record<QueryStatus, TkBadgeVariant> = {
  interpreting: 'info',
  awaiting_approval: 'warning',
  approved: 'accent',
  executing: 'info',
  completed: 'success',
  failed: 'error',
  rejected: 'neutral',
};

const STATUS_LABEL_MAP: Record<QueryStatus, string> = {
  interpreting: 'Interpreting',
  awaiting_approval: 'Awaiting Approval',
  approved: 'Approved',
  executing: 'Executing',
  completed: 'Completed',
  failed: 'Failed',
  rejected: 'Rejected',
};

@Component({
  selector: 'app-query-history',
  standalone: true,
  imports: [
    TkBadgeComponent,
    TkPaginationComponent,
    TkSpinnerComponent,
    TkSelectComponent,
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

  readonly statusOptions = QUERY_STATUS_OPTIONS;
  readonly statusSelectOptions: TkSelectOption[] = QUERY_STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }));

  // Client-side display pagination
  readonly displayPage = signal(0);
  readonly displayPageSize = signal(25);
  readonly pageSizeOptions = [10, 25, 50, 100];
  readonly sizeDropdownOpen = signal(false);

  readonly paginatedQueries = computed(() => {
    const start = this.displayPage() * this.displayPageSize();
    return this.queries().slice(start, start + this.displayPageSize());
  });
  readonly totalDisplayRows = computed(() => this.queries().length);
  readonly totalDisplayPages = computed(() => Math.max(1, Math.ceil(this.totalDisplayRows() / this.displayPageSize())));
  readonly showDisplayPagination = computed(() => this.totalDisplayRows() > this.displayPageSize());
  readonly displayRangeStart = computed(() => this.totalDisplayRows() === 0 ? 0 : this.displayPage() * this.displayPageSize() + 1);
  readonly displayRangeEnd = computed(() => Math.min((this.displayPage() + 1) * this.displayPageSize(), this.totalDisplayRows()));
  readonly canDisplayPrev = computed(() => this.displayPage() > 0);
  readonly canDisplayNext = computed(() => this.displayPage() < this.totalDisplayPages() - 1);

  ngOnInit(): void {
    this.loadQueries();
    this.loadIntegrationNames();
  }

  getStatusVariant(status: QueryStatus): TkBadgeVariant {
    return STATUS_VARIANT_MAP[status] ?? 'neutral';
  }

  getStatusLabel(status: QueryStatus): string {
    return STATUS_LABEL_MAP[status] ?? status;
  }

  getIntegrationLabel(id: string): string {
    return this.integrationNames().get(id) ?? id.substring(0, 8) + '... (disconnected)';
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.queries.set([]);
    this.pagination.set(null);
    this.displayPage.set(0);
    this.loadQueries();
  }

  displayPrevPage(): void { if (this.canDisplayPrev()) this.displayPage.update(p => p - 1); }
  displayNextPage(): void { if (this.canDisplayNext()) this.displayPage.update(p => p + 1); }
  selectDisplayPageSize(size: number): void { this.displayPageSize.set(size); this.displayPage.set(0); this.sizeDropdownOpen.set(false); }
  toggleSizeDropdown(): void { this.sizeDropdownOpen.update(v => !v); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.sizeDropdownOpen() && !(event.target as HTMLElement).closest('.size-dropdown')) {
      this.sizeDropdownOpen.set(false);
    }
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
