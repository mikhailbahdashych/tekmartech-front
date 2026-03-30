import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TkSpinnerComponent } from '@shared/components/tk-spinner/tk-spinner.component';
import { TkSelectComponent, TkSelectOption } from '@shared/components/tk-select/tk-select.component';
import { ActivityLogService } from '@features/activity-logs/services/activity-log.service';
import { UserService } from '@features/users/services/user.service';
import { ActivityLogResponse, ActivityAction } from '@features/activity-logs/models/activity-log.model';
import { PaginationResponse } from '@features/queries/models';
import { User } from '@core/models';

interface ActionOption { value: ActivityAction; label: string }

const ACTION_OPTIONS: ActionOption[] = [
  { value: 'user_registered', label: 'User Registered' },
  { value: 'user_login', label: 'User Login' },
  { value: 'user_invited', label: 'User Invited' },
  { value: 'user_removed', label: 'User Removed' },
  { value: 'user_role_changed', label: 'Role Changed' },
  { value: 'integration_connected', label: 'Integration Connected' },
  { value: 'integration_disconnected', label: 'Integration Disconnected' },
  { value: 'integration_health_checked', label: 'Integration Tested' },
  { value: 'query_submitted', label: 'Query Submitted' },
  { value: 'query_plan_approved', label: 'Plan Approved' },
  { value: 'query_plan_rejected', label: 'Plan Rejected' },
  { value: 'organization_updated', label: 'Organization Updated' },
];

const ACTION_LABELS: Record<ActivityAction, (meta: Record<string, unknown> | null) => string> = {
  user_registered: () => 'Registered a new account',
  user_login: () => 'Logged in',
  user_invited: (m) => `Invited ${m?.['email'] ?? 'a user'} as ${m?.['role'] ?? 'member'}`,
  user_removed: () => 'Removed a user',
  user_role_changed: (m) => `Changed role from ${m?.['from'] ?? '?'} to ${m?.['to'] ?? '?'}`,
  integration_connected: () => 'Connected integration',
  integration_disconnected: () => 'Disconnected integration',
  integration_health_checked: () => 'Tested integration connection',
  query_submitted: () => 'Submitted a query',
  query_plan_approved: () => 'Approved a query plan',
  query_plan_rejected: () => 'Rejected a query plan',
  organization_updated: () => 'Updated organization settings',
};

@Component({
  selector: 'app-activity-log-list',
  standalone: true,
  imports: [DatePipe, TkSpinnerComponent, TkSelectComponent],
  templateUrl: './activity-log-list.component.html',
  styleUrl: './activity-log-list.component.scss',
})
export class ActivityLogListComponent implements OnInit {
  private logService = inject(ActivityLogService);
  private userService = inject(UserService);
  private router = inject(Router);

  readonly actionSelectOptions: TkSelectOption[] = ACTION_OPTIONS.map(o => ({ value: o.value, label: o.label }));
  readonly userSelectOptions = computed<TkSelectOption[]>(() =>
    this.users().map(u => ({ value: u.id, label: u.display_name }))
  );

  readonly logs = signal<ActivityLogResponse[]>([]);
  readonly pagination = signal<PaginationResponse | null>(null);
  readonly users = signal<User[]>([]);
  readonly isLoading = signal(true);
  readonly actionFilter = signal('');
  readonly userFilter = signal('');

  // Server-driven pagination
  readonly pageSize = signal(25);
  readonly pageSizeOptions = [10, 25, 50, 100];
  readonly sizeDropdownOpen = signal(false);
  readonly cursorStack = signal<string[]>([]);

  readonly totalCount = computed(() => this.pagination()?.total_count ?? 0);
  readonly hasMore = computed(() => this.pagination()?.has_more ?? false);
  readonly currentPage = computed(() => this.cursorStack().length);
  readonly rangeStart = computed(() => this.logs().length === 0 ? 0 : this.currentPage() * this.pageSize() + 1);
  readonly rangeEnd = computed(() => this.currentPage() * this.pageSize() + this.logs().length);
  readonly canPrev = computed(() => this.cursorStack().length > 0);
  readonly canNext = computed(() => this.hasMore());

  ngOnInit(): void {
    this.loadPage();
    this.userService.listUsers({ limit: 100 }).subscribe({
      next: (r) => this.users.set(r.users),
    });
  }

  formatAction(log: ActivityLogResponse): string {
    const formatter = ACTION_LABELS[log.action];
    return formatter ? formatter(log.metadata) : log.action;
  }

  onActionFilterChange(action: string): void {
    this.actionFilter.set(action);
    this.cursorStack.set([]);
    this.loadPage();
  }

  onUserFilterChange(userId: string): void {
    this.userFilter.set(userId);
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

  navigateToTarget(log: ActivityLogResponse): void {
    if (!log.target_type || !log.target_id) return;
    switch (log.target_type) {
      case 'query': this.router.navigate(['/queries', log.target_id]); break;
      case 'integration': this.router.navigate(['/integrations']); break;
      case 'user': this.router.navigate(['/users']); break;
    }
  }

  targetLabel(log: ActivityLogResponse): string | null {
    if (!log.target_type) return null;
    switch (log.target_type) {
      case 'query': return 'Query';
      case 'integration': return 'Integration';
      case 'user': return 'User';
      case 'organization': return 'Organization';
      default: return log.target_type;
    }
  }

  private loadPage(cursor?: string): void {
    this.isLoading.set(true);
    const params: Record<string, string | number> = { limit: this.pageSize() };
    if (this.actionFilter()) params['action'] = this.actionFilter();
    if (this.userFilter()) params['user_id'] = this.userFilter();
    if (cursor) params['cursor'] = cursor;

    this.logService.listActivityLogs(params as any).subscribe({
      next: (response) => {
        this.logs.set(response.activity_logs);
        this.pagination.set(response.pagination);
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); },
    });
  }
}
