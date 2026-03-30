import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TkBadgeComponent, TkBadgeVariant } from '@shared/components/tk-badge/tk-badge.component';
import { TkSpinnerComponent } from '@shared/components/tk-spinner/tk-spinner.component';
import { TkSelectComponent, TkSelectOption } from '@shared/components/tk-select/tk-select.component';
import { TkEmptyStateComponent } from '@shared/components/tk-empty-state/tk-empty-state.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { Search } from 'lucide-angular';
import { QueryService } from '@features/queries/services/query.service';
import { QueryResponse, QueryStatus, PaginationResponse } from '@features/queries/models';
import { QUERY_STATUS_OPTIONS } from '@features/queries/constants/query-status';
import { IntegrationService } from '@features/integrations/services/integration.service';

const STATUS_VARIANT_MAP: Record<QueryStatus, TkBadgeVariant> = {
  interpreting: 'info', awaiting_approval: 'warning', approved: 'accent',
  executing: 'info', completed: 'success', failed: 'error', rejected: 'neutral',
};

const STATUS_LABEL_MAP: Record<QueryStatus, string> = {
  interpreting: 'Interpreting', awaiting_approval: 'Awaiting Approval', approved: 'Approved',
  executing: 'Executing', completed: 'Completed', failed: 'Failed', rejected: 'Rejected',
};

@Component({
  selector: 'app-query-history',
  standalone: true,
  imports: [TkBadgeComponent, TkSpinnerComponent, TkSelectComponent, TkEmptyStateComponent, RelativeTimePipe],
  templateUrl: './query-history.component.html',
  styleUrl: './query-history.component.scss',
})
export class QueryHistoryComponent implements OnInit {
  private queryService = inject(QueryService);
  private integrationService = inject(IntegrationService);
  private router = inject(Router);

  readonly emptyIcons = { Search };
  readonly statusSelectOptions: TkSelectOption[] = QUERY_STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }));

  readonly queries = signal<QueryResponse[]>([]);
  readonly pagination = signal<PaginationResponse | null>(null);
  readonly isLoading = signal(false);
  readonly statusFilter = signal('');
  readonly integrationNames = signal<Map<string, string>>(new Map());

  // Server-driven pagination
  readonly pageSize = signal(25);
  readonly pageSizeOptions = [10, 25, 50, 100];
  readonly sizeDropdownOpen = signal(false);
  readonly cursorStack = signal<string[]>([]);

  readonly totalCount = computed(() => this.pagination()?.total_count ?? 0);
  readonly hasMore = computed(() => this.pagination()?.has_more ?? false);
  readonly currentPage = computed(() => this.cursorStack().length);
  readonly rangeStart = computed(() => this.queries().length === 0 ? 0 : this.currentPage() * this.pageSize() + 1);
  readonly rangeEnd = computed(() => this.currentPage() * this.pageSize() + this.queries().length);
  readonly canPrev = computed(() => this.cursorStack().length > 0);
  readonly canNext = computed(() => this.hasMore());

  ngOnInit(): void {
    this.loadPage();
    this.loadIntegrationNames();
  }

  getStatusVariant(status: QueryStatus): TkBadgeVariant { return STATUS_VARIANT_MAP[status] ?? 'neutral'; }
  getStatusLabel(status: QueryStatus): string { return STATUS_LABEL_MAP[status] ?? status; }
  getIntegrationLabel(id: string): string {
    return this.integrationNames().get(id) ?? id.substring(0, 8) + '... (disconnected)';
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.cursorStack.set([]);
    this.loadPage();
  }

  selectPageSize(size: number): void {
    this.pageSize.set(size);
    this.cursorStack.set([]);
    this.sizeDropdownOpen.set(false);
    this.loadPage();
  }

  toggleSizeDropdown(): void { this.sizeDropdownOpen.update(v => !v); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.sizeDropdownOpen() && !(event.target as HTMLElement).closest('.size-dropdown')) {
      this.sizeDropdownOpen.set(false);
    }
  }

  nextPage(): void {
    const nextCursor = this.pagination()?.next_cursor;
    if (!nextCursor) return;
    this.cursorStack.update(stack => [...stack, nextCursor]);
    this.loadPage(nextCursor);
  }

  prevPage(): void {
    const stack = this.cursorStack();
    if (stack.length === 0) return;
    const newStack = stack.slice(0, -1);
    this.cursorStack.set(newStack);
    const cursor = newStack.length > 0 ? newStack[newStack.length - 1] : undefined;
    this.loadPage(cursor);
  }

  navigateToQuery(query: QueryResponse): void {
    this.router.navigate(['/queries', query.id]);
  }

  truncateText(text: string, maxLength: number = 80): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  private loadPage(cursor?: string): void {
    this.isLoading.set(true);
    const params: Record<string, string | number> = { limit: this.pageSize() };
    if (this.statusFilter()) params['status'] = this.statusFilter();
    if (cursor) params['cursor'] = cursor;

    this.queryService.listQueries(params).subscribe({
      next: (response) => {
        this.queries.set(response.queries);
        this.pagination.set(response.pagination);
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); },
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
