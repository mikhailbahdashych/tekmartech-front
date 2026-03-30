import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { TkNotificationService } from '@shared/components/tk-notification/tk-notification.service';
import { Plus, MoreVertical, Users } from 'lucide-angular';
import { TkEmptyStateComponent } from '@shared/components/tk-empty-state/tk-empty-state.component';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkSpinnerComponent } from '@shared/components/tk-spinner/tk-spinner.component';
import { TkBadgeComponent, TkBadgeVariant } from '@shared/components/tk-badge/tk-badge.component';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { TkPaginationComponent } from '@shared/components/tk-pagination/tk-pagination.component';
import { TkMultiSelectComponent, TkMultiSelectOption } from '@shared/components/tk-multi-select/tk-multi-select.component';
import { TkSearchInputComponent } from '@shared/components/tk-search-input/tk-search-input.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { UserService } from '@features/users/services/user.service';
import { InvitationResponse, InvitationStatus } from '@features/users/models/user-management.model';
import { User } from '@core/models';
import { AuthService } from '@core/services/auth.service';
import { InviteDialogComponent } from '@features/users/components/invite-dialog/invite-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '@features/users/components/confirm-dialog/confirm-dialog.component';
import { PaginationResponse } from '@features/queries/models';
import { parseEnumList, parseSearchString, syncFiltersToUrl } from '@core/utils/query-params';

@Component({
  selector: 'user-list',
  standalone: true,
  imports: [
    MatMenuModule,
    TkButtonComponent,
    TkSpinnerComponent,
    TkBadgeComponent,
    TkIconComponent,
    TkPaginationComponent,
    TkMultiSelectComponent,
    TkSearchInputComponent,
    TkEmptyStateComponent,
    RelativeTimePipe,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private notify = inject(TkNotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private static readonly VALID_ROLES = ['admin', 'member'] as const;
  private static readonly VALID_STATUSES = ['active', 'disabled'] as const;

  readonly icons = { Plus, MoreVertical, Users };

  readonly searchQuery = signal('');
  readonly selectedRoles = signal<string[]>([]);
  readonly selectedStatuses = signal<string[]>([]);

  readonly roleFilterOptions: TkMultiSelectOption[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'member', label: 'Member' },
  ];

  readonly statusFilterOptions: TkMultiSelectOption[] = [
    { value: 'active', label: 'Active' },
    { value: 'disabled', label: 'Disabled' },
  ];

  readonly users = signal<User[]>([]);
  readonly invitations = signal<InvitationResponse[]>([]);
  readonly isLoadingUsers = signal(true);
  readonly isLoadingInvitations = signal(true);
  readonly usersPagination = signal<PaginationResponse | null>(null);
  readonly invitationsPagination = signal<PaginationResponse | null>(null);

  // Client-side display pagination — users
  readonly usersPage = signal(0);
  readonly usersPageSize = signal(25);
  readonly usersPageSizeOptions = [10, 25, 50, 100];
  readonly usersSizeDropdownOpen = signal(false);

  readonly paginatedUsers = computed(() => {
    const start = this.usersPage() * this.usersPageSize();
    return this.users().slice(start, start + this.usersPageSize());
  });
  readonly totalUsers = computed(() => this.users().length);
  readonly showUsersPagination = computed(() => this.totalUsers() > this.usersPageSize());
  readonly usersRangeStart = computed(() => this.totalUsers() === 0 ? 0 : this.usersPage() * this.usersPageSize() + 1);
  readonly usersRangeEnd = computed(() => Math.min((this.usersPage() + 1) * this.usersPageSize(), this.totalUsers()));
  readonly canUsersPrev = computed(() => this.usersPage() > 0);
  readonly canUsersNext = computed(() => this.usersPage() < Math.ceil(this.totalUsers() / this.usersPageSize()) - 1);

  // Client-side display pagination — invitations
  readonly invPage = signal(0);
  readonly invPageSize = signal(25);
  readonly invPageSizeOptions = [10, 25, 50];
  readonly invSizeDropdownOpen = signal(false);

  readonly paginatedInvitations = computed(() => {
    const start = this.invPage() * this.invPageSize();
    return this.invitations().slice(start, start + this.invPageSize());
  });
  readonly totalInvitations = computed(() => this.invitations().length);
  readonly showInvPagination = computed(() => this.totalInvitations() > this.invPageSize());
  readonly invRangeStart = computed(() => this.totalInvitations() === 0 ? 0 : this.invPage() * this.invPageSize() + 1);
  readonly invRangeEnd = computed(() => Math.min((this.invPage() + 1) * this.invPageSize(), this.totalInvitations()));
  readonly canInvPrev = computed(() => this.invPage() > 0);
  readonly canInvNext = computed(() => this.invPage() < Math.ceil(this.totalInvitations() / this.invPageSize()) - 1);

  get currentUserId(): string | null {
    return this.authService.currentUser()?.id ?? null;
  }

  getRoleVariant(role: string): TkBadgeVariant { return role === 'admin' ? 'accent' : 'neutral'; }
  getRoleLabel(role: string): string { return role === 'admin' ? 'Admin' : 'Member'; }
  getStatusVariant(status: string): TkBadgeVariant { return status === 'active' ? 'success' : 'neutral'; }
  getStatusLabel(status: string): string { return status === 'active' ? 'Active' : 'Disabled'; }

  getInvitationStatusVariant(status: InvitationStatus): TkBadgeVariant {
    const map: Record<InvitationStatus, TkBadgeVariant> = { pending: 'warning', accepted: 'success', expired: 'neutral', revoked: 'neutral' };
    return map[status] ?? 'neutral';
  }

  getInvitationStatusLabel(status: InvitationStatus): string {
    const map: Record<InvitationStatus, string> = { pending: 'Pending', accepted: 'Accepted', expired: 'Expired', revoked: 'Revoked' };
    return map[status] ?? status;
  }

  ngOnInit(): void {
    this.restoreFiltersFromUrl();
    this.loadUsers();
    this.loadInvitations();
  }

  // Users pagination controls
  usersPrevPage(): void { if (this.canUsersPrev()) this.usersPage.update(p => p - 1); }
  usersNextPage(): void { if (this.canUsersNext()) this.usersPage.update(p => p + 1); }
  selectUsersPageSize(size: number): void { this.usersPageSize.set(size); this.usersPage.set(0); this.usersSizeDropdownOpen.set(false); }
  toggleUsersSizeDropdown(): void { this.usersSizeDropdownOpen.update(v => !v); }

  // Invitations pagination controls
  invPrevPage(): void { if (this.canInvPrev()) this.invPage.update(p => p - 1); }
  invNextPage(): void { if (this.canInvNext()) this.invPage.update(p => p + 1); }
  selectInvPageSize(size: number): void { this.invPageSize.set(size); this.invPage.set(0); this.invSizeDropdownOpen.set(false); }
  toggleInvSizeDropdown(): void { this.invSizeDropdownOpen.update(v => !v); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.usersSizeDropdownOpen() && !target.closest('.users-size-dropdown')) this.usersSizeDropdownOpen.set(false);
    if (this.invSizeDropdownOpen() && !target.closest('.inv-size-dropdown')) this.invSizeDropdownOpen.set(false);
  }

  onSearchChange(search: string): void {
    this.searchQuery.set(search);
    this.usersPage.set(0);
    this.syncUrl();
    this.loadUsers();
  }

  onRoleFilterChange(roles: string[]): void {
    this.selectedRoles.set(roles);
    this.usersPage.set(0);
    this.syncUrl();
    this.loadUsers();
  }

  onStatusFilterChange(statuses: string[]): void {
    this.selectedStatuses.set(statuses);
    this.usersPage.set(0);
    this.syncUrl();
    this.loadUsers();
  }

  loadMoreUsers(): void {
    const cursor = this.usersPagination()?.next_cursor;
    if (cursor) this.loadUsers(cursor);
  }

  loadMoreInvitations(): void {
    const cursor = this.invitationsPagination()?.next_cursor;
    if (cursor) this.loadInvitations(cursor);
  }

  openInviteDialog(): void {
    const dialogRef = this.dialog.open(InviteDialogComponent, { width: '440px' });
    dialogRef.afterClosed().subscribe((invitation: InvitationResponse | null) => {
      if (invitation) {
        this.invitations.update(list => [invitation, ...list]);
        this.notify.success(`Invitation sent to ${invitation.email}`);
      }
    });
  }

  changeRole(user: User): void {
    const newRole = user.role === 'admin' ? 'member' : 'admin';
    const data: ConfirmDialogData = {
      title: 'Change Role',
      message: `Change ${user.display_name}'s role from ${user.role} to ${newRole}?`,
      confirmLabel: `Make ${newRole}`,
      confirmColor: 'primary',
      testIdPrefix: 'user-role-change',
    };
    this.dialog.open(ConfirmDialogComponent, { width: '420px', data }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.userService.changeRole(user.id, newRole).subscribe({
        next: (response) => {
          this.users.update(list => list.map(u => u.id === user.id ? response.user : u));
          this.notify.success(`${user.display_name} is now ${newRole}`);
        },
        error: (err) => {
          this.notify.error(err.error?.error?.message ?? 'Failed to change role');
        },
      });
    });
  }

  removeUser(user: User): void {
    const data: ConfirmDialogData = {
      title: 'Remove User',
      message: `Remove ${user.display_name} from the organization? This will revoke their access immediately.`,
      confirmLabel: 'Remove',
      confirmColor: 'warn',
      testIdPrefix: 'user-remove',
    };
    this.dialog.open(ConfirmDialogComponent, { width: '420px', data }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.userService.removeUser(user.id).subscribe({
        next: () => {
          this.users.update(list => list.filter(u => u.id !== user.id));
          this.notify.success(`${user.display_name} has been removed`);
        },
        error: (err) => {
          this.notify.error(err.error?.error?.message ?? 'Failed to remove user');
        },
      });
    });
  }

  revokeInvitation(invitation: InvitationResponse): void {
    const data: ConfirmDialogData = {
      title: 'Revoke Invitation',
      message: `Revoke the invitation to ${invitation.email}?`,
      confirmLabel: 'Revoke',
      confirmColor: 'warn',
    };
    this.dialog.open(ConfirmDialogComponent, { width: '420px', data }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.userService.revokeInvitation(invitation.id).subscribe({
        next: (response) => {
          this.invitations.update(list => list.map(i => i.id === invitation.id ? response.invitation : i));
          this.notify.success('Invitation revoked');
        },
        error: (err) => {
          this.notify.error(err.error?.error?.message ?? 'Failed to revoke invitation');
        },
      });
    });
  }

  private loadUsers(cursor?: string): void {
    this.isLoadingUsers.set(true);
    const params: Record<string, string | number | undefined> = { limit: 50, cursor };
    if (this.searchQuery()) params['search'] = this.searchQuery();
    if (this.selectedRoles().length > 0) params['role'] = this.selectedRoles().join(',');
    if (this.selectedStatuses().length > 0) params['status'] = this.selectedStatuses().join(',');
    this.userService.listUsers(params as any).subscribe({
      next: (response) => {
        if (cursor) {
          this.users.update(existing => [...existing, ...response.users]);
        } else {
          this.users.set(response.users);
        }
        this.usersPagination.set(response.pagination);
        this.isLoadingUsers.set(false);
      },
      error: () => { this.isLoadingUsers.set(false); },
    });
  }

  private loadInvitations(cursor?: string): void {
    this.isLoadingInvitations.set(true);
    this.userService.listInvitations({ status: 'pending', limit: 50, cursor }).subscribe({
      next: (response) => {
        if (cursor) {
          this.invitations.update(existing => [...existing, ...response.invitations]);
        } else {
          this.invitations.set(response.invitations);
        }
        this.invitationsPagination.set(response.pagination);
        this.isLoadingInvitations.set(false);
      },
      error: () => { this.isLoadingInvitations.set(false); },
    });
  }

  private restoreFiltersFromUrl(): void {
    const params = this.route.snapshot.queryParamMap;
    this.searchQuery.set(parseSearchString(params.get('search')));
    this.selectedRoles.set(parseEnumList(params.get('role'), UserListComponent.VALID_ROLES as unknown as string[]));
    this.selectedStatuses.set(parseEnumList(params.get('status'), UserListComponent.VALID_STATUSES as unknown as string[]));
  }

  private syncUrl(): void {
    syncFiltersToUrl(this.router, this.route, {
      search: this.searchQuery() || null,
      role: this.selectedRoles().length > 0 ? this.selectedRoles().join(',') : null,
      status: this.selectedStatuses().length > 0 ? this.selectedStatuses().join(',') : null,
    });
  }
}
