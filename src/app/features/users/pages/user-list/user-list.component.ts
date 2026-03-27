import { Component, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule, Plus, MoreVertical } from 'lucide-angular';
import { StatusBadgeComponent, StatusConfig } from '../../../../shared/components/status-badge/status-badge.component';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';
import { UserService } from '../../services/user.service';
import { InvitationResponse } from '../../models/user-management.model';
import { User } from '../../../../core/models';
import { AuthService } from '../../../../core/services/auth.service';
import { InviteDialogComponent } from '../../components/invite-dialog/invite-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    LucideAngularModule,
    StatusBadgeComponent,
    RelativeTimePipe,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly icons = { Plus, MoreVertical };

  readonly users = signal<User[]>([]);
  readonly invitations = signal<InvitationResponse[]>([]);
  readonly isLoadingUsers = signal(true);
  readonly isLoadingInvitations = signal(true);

  readonly roleConfig: Record<string, StatusConfig> = {
    admin:  { label: 'Admin',  colorClass: 'text-indigo-700', bgClass: 'bg-indigo-50' },
    member: { label: 'Member', colorClass: 'text-slate-600',  bgClass: 'bg-slate-100' },
  };

  readonly statusConfig: Record<string, StatusConfig> = {
    active:   { label: 'Active',   colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50' },
    disabled: { label: 'Disabled', colorClass: 'text-slate-600',   bgClass: 'bg-slate-100' },
  };

  readonly invitationStatusConfig: Record<string, StatusConfig> = {
    pending:  { label: 'Pending',  colorClass: 'text-amber-700',   bgClass: 'bg-amber-50' },
    accepted: { label: 'Accepted', colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50' },
    expired:  { label: 'Expired',  colorClass: 'text-slate-600',   bgClass: 'bg-slate-100' },
    revoked:  { label: 'Revoked',  colorClass: 'text-slate-600',   bgClass: 'bg-slate-100' },
  };

  get currentUserId(): string | null {
    return this.authService.currentUser()?.id ?? null;
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadInvitations();
  }

  openInviteDialog(): void {
    const dialogRef = this.dialog.open(InviteDialogComponent, { width: '440px' });
    dialogRef.afterClosed().subscribe((invitation: InvitationResponse | null) => {
      if (invitation) {
        this.invitations.update(list => [invitation, ...list]);
        this.snackBar.open(`Invitation sent to ${invitation.email}`, 'Dismiss', { duration: 4000 });
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
    };
    this.dialog.open(ConfirmDialogComponent, { width: '420px', data }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.userService.changeRole(user.id, newRole).subscribe({
        next: (response) => {
          this.users.update(list => list.map(u => u.id === user.id ? response.user : u));
          this.snackBar.open(`${user.display_name} is now ${newRole}`, 'Dismiss', { duration: 4000 });
        },
        error: (err) => {
          this.snackBar.open(err.error?.error?.message ?? 'Failed to change role', 'Dismiss', { duration: 6000 });
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
    };
    this.dialog.open(ConfirmDialogComponent, { width: '420px', data }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.userService.removeUser(user.id).subscribe({
        next: () => {
          this.users.update(list => list.filter(u => u.id !== user.id));
          this.snackBar.open(`${user.display_name} has been removed`, 'Dismiss', { duration: 4000 });
        },
        error: (err) => {
          this.snackBar.open(err.error?.error?.message ?? 'Failed to remove user', 'Dismiss', { duration: 6000 });
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
          this.snackBar.open('Invitation revoked', 'Dismiss', { duration: 4000 });
        },
        error: (err) => {
          this.snackBar.open(err.error?.error?.message ?? 'Failed to revoke invitation', 'Dismiss', { duration: 6000 });
        },
      });
    });
  }

  private loadUsers(): void {
    this.isLoadingUsers.set(true);
    this.userService.listUsers({ limit: 100 }).subscribe({
      next: (response) => { this.users.set(response.users); this.isLoadingUsers.set(false); },
      error: () => { this.isLoadingUsers.set(false); },
    });
  }

  private loadInvitations(): void {
    this.isLoadingInvitations.set(true);
    this.userService.listInvitations({ status: 'pending', limit: 100 }).subscribe({
      next: (response) => { this.invitations.set(response.invitations); this.isLoadingInvitations.set(false); },
      error: () => { this.isLoadingInvitations.set(false); },
    });
  }
}
