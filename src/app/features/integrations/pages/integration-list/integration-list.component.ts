import { Component, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Plug, RefreshCw, Unplug, Plus } from 'lucide-angular';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkSpinnerComponent } from '@shared/components/tk-spinner/tk-spinner.component';
import { TkBadgeComponent, TkBadgeVariant } from '@shared/components/tk-badge/tk-badge.component';
import { TkCardComponent } from '@shared/components/tk-card/tk-card.component';
import { TkEmptyStateComponent } from '@shared/components/tk-empty-state/tk-empty-state.component';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { IntegrationService } from '../../services/integration.service';
import { IntegrationResponse, IntegrationStatus, HealthStatus } from '../../models';
import { INTEGRATION_TYPE_CONFIG } from '../../constants/integration-config';
import { ConnectDialogComponent } from '../../components/connect-dialog/connect-dialog.component';
import { DisconnectDialogComponent, DisconnectDialogData } from '../../components/disconnect-dialog/disconnect-dialog.component';

@Component({
  selector: 'app-integration-list',
  standalone: true,
  imports: [
    TkButtonComponent,
    TkSpinnerComponent,
    TkBadgeComponent,
    TkCardComponent,
    TkEmptyStateComponent,
    TkIconComponent,
    RelativeTimePipe,
  ],
  templateUrl: './integration-list.component.html',
  styleUrl: './integration-list.component.scss',
})
export class IntegrationListComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly icons = { Plus, Plug, RefreshCw, Unplug };
  readonly typeConfig = INTEGRATION_TYPE_CONFIG;

  readonly integrations = signal<IntegrationResponse[]>([]);
  readonly isLoading = signal(true);
  readonly testingIds = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadIntegrations();
  }

  getStatusVariant(status: IntegrationStatus): TkBadgeVariant {
    const map: Record<IntegrationStatus, TkBadgeVariant> = {
      active: 'success',
      inactive: 'neutral',
      error: 'error',
    };
    return map[status] ?? 'neutral';
  }

  getStatusLabel(status: IntegrationStatus): string {
    const map: Record<IntegrationStatus, string> = {
      active: 'Active',
      inactive: 'Inactive',
      error: 'Error',
    };
    return map[status] ?? status;
  }

  getHealthVariant(health: HealthStatus): TkBadgeVariant {
    const map: Record<HealthStatus, TkBadgeVariant> = {
      healthy: 'success',
      unhealthy: 'error',
      unknown: 'neutral',
    };
    return map[health] ?? 'neutral';
  }

  getHealthLabel(health: HealthStatus): string {
    const map: Record<HealthStatus, string> = {
      healthy: 'Healthy',
      unhealthy: 'Unhealthy',
      unknown: 'Unknown',
    };
    return map[health] ?? health;
  }

  openConnectDialog(): void {
    const dialogRef = this.dialog.open(ConnectDialogComponent, {
      width: '560px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result: IntegrationResponse | null) => {
      if (result) {
        this.integrations.update(list => [result, ...list]);
        this.snackBar.open('Integration connected successfully', 'Dismiss', { duration: 4000 });
      }
    });
  }

  testConnection(integration: IntegrationResponse): void {
    this.testingIds.update(ids => new Set(ids).add(integration.id));

    this.integrationService.testIntegration(integration.id).subscribe({
      next: (response) => {
        this.integrations.update(list =>
          list.map(i => i.id === integration.id ? response.integration : i)
        );
        this.testingIds.update(ids => {
          const next = new Set(ids);
          next.delete(integration.id);
          return next;
        });
        const status = response.integration.last_health_check_status;
        if (status === 'healthy') {
          this.snackBar.open('Connection is healthy', 'Dismiss', { duration: 4000 });
        } else {
          this.snackBar.open('Connection check failed — status: ' + status, 'Dismiss', { duration: 6000 });
        }
      },
      error: (err) => {
        this.testingIds.update(ids => {
          const next = new Set(ids);
          next.delete(integration.id);
          return next;
        });
        this.snackBar.open(
          err.error?.error?.message ?? 'Failed to test connection',
          'Dismiss',
          { duration: 6000 },
        );
      },
    });
  }

  openDisconnectDialog(integration: IntegrationResponse): void {
    const data: DisconnectDialogData = {
      integrationId: integration.id,
      displayName: integration.display_name,
    };

    const dialogRef = this.dialog.open(DisconnectDialogComponent, {
      width: '480px',
      data,
    });

    dialogRef.afterClosed().subscribe((disconnected: boolean) => {
      if (disconnected) {
        this.integrations.update(list => list.filter(i => i.id !== integration.id));
        this.snackBar.open('Integration disconnected', 'Dismiss', { duration: 4000 });
      }
    });
  }

  isTesting(id: string): boolean {
    return this.testingIds().has(id);
  }

  private loadIntegrations(): void {
    this.isLoading.set(true);
    this.integrationService.listIntegrations({ limit: 100 }).subscribe({
      next: (response) => {
        this.integrations.set(response.integrations);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}
