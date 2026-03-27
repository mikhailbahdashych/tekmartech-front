import { Component, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LucideAngularModule, Plus, Plug, RefreshCw, Unplug } from 'lucide-angular';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';
import { IntegrationService } from '../../services/integration.service';
import { IntegrationResponse } from '../../models';
import {
  INTEGRATION_TYPE_CONFIG,
  INTEGRATION_STATUS_CONFIG,
  HEALTH_STATUS_CONFIG,
} from '../../constants/integration-config';
import { ConnectDialogComponent } from '../../components/connect-dialog/connect-dialog.component';
import { DisconnectDialogComponent, DisconnectDialogData } from '../../components/disconnect-dialog/disconnect-dialog.component';

@Component({
  selector: 'app-integration-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatProgressSpinnerModule,
    LucideAngularModule,
    StatusBadgeComponent,
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
  readonly statusConfig = INTEGRATION_STATUS_CONFIG;
  readonly healthConfig = HEALTH_STATUS_CONFIG;

  readonly integrations = signal<IntegrationResponse[]>([]);
  readonly isLoading = signal(true);
  readonly testingIds = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadIntegrations();
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
