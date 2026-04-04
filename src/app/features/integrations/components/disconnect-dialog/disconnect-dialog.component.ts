import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { AlertTriangle } from 'lucide-angular';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkSpinnerComponent } from '@shared/components/tk-spinner/tk-spinner.component';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { IntegrationService } from '@features/integrations/services/integration.service';

export interface DisconnectDialogData {
  integrationId: string;
  displayName: string;
}

@Component({
  selector: 'disconnect-dialog',
  standalone: true,
  imports: [MatDialogModule, TkButtonComponent, TkSpinnerComponent, TkIconComponent],
  templateUrl: './disconnect-dialog.component.html',
  styleUrl: './disconnect-dialog.component.scss',
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
