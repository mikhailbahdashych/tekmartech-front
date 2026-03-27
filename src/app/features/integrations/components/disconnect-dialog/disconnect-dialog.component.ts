import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LucideAngularModule, AlertTriangle } from 'lucide-angular';
import { IntegrationService } from '../../services/integration.service';

export interface DisconnectDialogData {
  integrationId: string;
  displayName: string;
}

@Component({
  selector: 'app-disconnect-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule, LucideAngularModule],
  template: `
    <div data-testid="integration-disconnect-dialog">
      <h2 mat-dialog-title class="font-heading text-lg font-semibold text-slate-900">
        Disconnect Integration
      </h2>
      <mat-dialog-content>
        <div class="flex items-start gap-3 mb-4">
          <lucide-icon [img]="icons.AlertTriangle" [size]="20" [strokeWidth]="2" class="text-amber-500 mt-0.5 shrink-0"></lucide-icon>
          <div>
            <p class="text-sm text-slate-700">
              Disconnect <strong>{{ data.displayName }}</strong>?
            </p>
            <p class="mt-1 text-sm text-slate-500">
              This will remove the integration and its stored credentials. Existing query results will be preserved.
            </p>
          </div>
        </div>
        @if (errorMessage(); as error) {
          <div class="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{{ error }}</div>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button [disabled]="isDisconnecting()" (click)="onCancel()" data-testid="integration-disconnect-cancel-button">Cancel</button>
        <button mat-flat-button class="disconnect-btn" [disabled]="isDisconnecting()" (click)="onDisconnect()" data-testid="integration-disconnect-confirm-button">
          @if (isDisconnecting()) {
            <mat-spinner diameter="16" class="inline-spinner"></mat-spinner>
          } @else {
            Disconnect
          }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .disconnect-btn {
      background-color: #dc2626 !important;
      color: white !important;
      border-radius: 0.5rem !important;
      &[disabled] { opacity: 0.5; }
    }
    .inline-spinner { display: inline-block; }
    .inline-spinner ::ng-deep circle { stroke: white; }
  `],
})
export class DisconnectDialogComponent {
  readonly data = inject<DisconnectDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<DisconnectDialogComponent>);
  private integrationService = inject(IntegrationService);

  readonly icons = { AlertTriangle };
  readonly isDisconnecting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onDisconnect(): void {
    this.isDisconnecting.set(true);
    this.errorMessage.set(null);

    this.integrationService.disconnectIntegration(this.data.integrationId).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isDisconnecting.set(false);
        this.errorMessage.set(err.error?.error?.message ?? 'Failed to disconnect integration.');
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
