import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TkSpinnerComponent } from '@shared/components/tk-spinner/tk-spinner.component';
import { TkPaginationComponent } from '@shared/components/tk-pagination/tk-pagination.component';
import { ActivityLogService } from '../../services/activity-log.service';
import { UserService } from '@features/users/services/user.service';
import { ActivityLogResponse, ActivityAction } from '../../models/activity-log.model';
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
  imports: [
    DatePipe,
    TkSpinnerComponent,
    TkPaginationComponent,
  ],
  templateUrl: './activity-log-list.component.html',
  styleUrl: './activity-log-list.component.scss',
})
export class ActivityLogListComponent implements OnInit {
  private logService = inject(ActivityLogService);
  private userService = inject(UserService);
  private router = inject(Router);

  readonly actionOptions = ACTION_OPTIONS;

  readonly logs = signal<ActivityLogResponse[]>([]);
  readonly pagination = signal<PaginationResponse | null>(null);
  readonly users = signal<User[]>([]);
  readonly isLoading = signal(true);
  readonly actionFilter = signal('');
  readonly userFilter = signal('');

  ngOnInit(): void {
    this.loadLogs();
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
    this.logs.set([]);
    this.loadLogs();
  }

  onUserFilterChange(userId: string): void {
    this.userFilter.set(userId);
    this.logs.set([]);
    this.loadLogs();
  }

  loadMore(): void {
    const cursor = this.pagination()?.next_cursor;
    if (cursor) this.loadLogs(cursor);
  }

  navigateToTarget(log: ActivityLogResponse): void {
    if (!log.target_type || !log.target_id) return;
    switch (log.target_type) {
      case 'query':
        this.router.navigate(['/queries', log.target_id]);
        break;
      case 'integration':
        this.router.navigate(['/integrations']);
        break;
      case 'user':
        this.router.navigate(['/users']);
        break;
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

  private loadLogs(cursor?: string): void {
    this.isLoading.set(true);
    const params: Record<string, string | number> = { limit: 50 };
    if (this.actionFilter()) params['action'] = this.actionFilter();
    if (this.userFilter()) params['user_id'] = this.userFilter();
    if (cursor) params['cursor'] = cursor;

    this.logService.listActivityLogs(params as any).subscribe({
      next: (response) => {
        if (cursor) {
          this.logs.update(existing => [...existing, ...response.activity_logs]);
        } else {
          this.logs.set(response.activity_logs);
        }
        this.pagination.set(response.pagination);
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); },
    });
  }
}
