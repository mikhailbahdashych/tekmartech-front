import { Component, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Plus, MoreVertical } from 'lucide-angular';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkSpinnerComponent } from '@shared/components/tk-spinner/tk-spinner.component';
import { TkBadgeComponent, TkBadgeVariant } from '@shared/components/tk-badge/tk-badge.component';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { UserService } from '../../services/user.service';
import { InvitationResponse, InvitationStatus } from '../../models/user-management.model';
import { User } from '@core/models';
import { AuthService } from '@core/services/auth.service';
import { InviteDialogComponent } from '../../components/invite-dialog/invite-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    MatMenuModule,
    TkButtonComponent,
    TkSpinnerComponent,
    TkBadgeComponent,
    TkIconComponent,
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

  get currentUserId(): string | null {
    return this.authService.currentUser()?.id ?? null;
  }

  getRoleVariant(role: string): TkBadgeVariant {
    return role === 'admin' ? 'accent' : 'neutral';
  }

  getRoleLabel(role: string): string {
    return role === 'admin' ? 'Admin' : 'Member';
  }

  getStatusVariant(status: string): TkBadgeVariant {
    return status === 'active' ? 'success' : 'neutral';
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'Active' : 'Disabled';
  }

  getInvitationStatusVariant(status: InvitationStatus): TkBadgeVariant {
    const map: Record<InvitationStatus, TkBadgeVariant> = {
      pending: 'warning',
      accepted: 'success',
      expired: 'neutral',
      revoked: 'neutral',
    };
    return map[status] ?? 'neutral';
  }

  getInvitationStatusLabel(status: InvitationStatus): string {
    const map: Record<InvitationStatus, string> = {
      pending: 'Pending',
      accepted: 'Accepted',
      expired: 'Expired',
      revoked: 'Revoked',
    };
    return map[status] ?? status;
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
      testIdPrefix: 'user-role-change',
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
      testIdPrefix: 'user-remove',
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
