import { Component, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TkNotificationService } from '@shared/components/tk-notification/tk-notification.service';
import { Plug, RefreshCw, Unplug, Plus } from 'lucide-angular';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkSpinnerComponent } from '@shared/components/tk-spinner/tk-spinner.component';
import { TkBadgeComponent, TkBadgeVariant } from '@shared/components/tk-badge/tk-badge.component';
import { TkCardComponent } from '@shared/components/tk-card/tk-card.component';
import { TkEmptyStateComponent } from '@shared/components/tk-empty-state/tk-empty-state.component';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { TkIntegrationIconComponent } from '@shared/components/tk-integration-icon/tk-integration-icon.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { IntegrationService } from '@features/integrations/services/integration.service';
import { IntegrationResponse, IntegrationStatus, HealthStatus } from '@features/integrations/models';
import { INTEGRATION_TYPE_CONFIG } from '@features/integrations/constants/integration-config';
import { ConnectDialogComponent } from '@features/integrations/components/connect-dialog/connect-dialog.component';
import { DisconnectDialogComponent, DisconnectDialogData } from '@features/integrations/components/disconnect-dialog/disconnect-dialog.component';

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
    TkIntegrationIconComponent,
    RelativeTimePipe,
  ],
  templateUrl: './integration-list.component.html',
  styleUrl: './integration-list.component.scss',
})
export class IntegrationListComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private dialog = inject(MatDialog);
  private notify = inject(TkNotificationService);

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
      panelClass: 'tk-dialog-overflow',
    });

    dialogRef.afterClosed().subscribe((result: IntegrationResponse | null) => {
      if (result) {
        this.integrations.update(list => [result, ...list]);
        this.notify.success('Integration connected successfully');
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
          this.notify.success('Connection is healthy');
        } else {
          this.notify.error('Connection check failed — status: ' + status);
        }
      },
      error: (err) => {
        this.testingIds.update(ids => {
          const next = new Set(ids);
          next.delete(integration.id);
          return next;
        });
        this.notify.error(err.error?.error?.message ?? 'Failed to test connection');
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
        this.notify.success('Integration disconnected');
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
