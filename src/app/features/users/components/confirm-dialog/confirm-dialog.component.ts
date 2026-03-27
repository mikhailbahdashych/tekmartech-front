import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: 'primary' | 'warn';
  testIdPrefix?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div [attr.data-testid]="data.testIdPrefix ? data.testIdPrefix + '-dialog' : null">
      <h2 mat-dialog-title class="font-heading text-lg font-semibold text-slate-900">{{ data.title }}</h2>
      <mat-dialog-content>
        <p class="text-sm text-slate-700">{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close(false)" [attr.data-testid]="data.testIdPrefix ? data.testIdPrefix + '-cancel-button' : null">Cancel</button>
        <button mat-flat-button [class]="data.confirmColor === 'warn' ? 'warn-btn' : 'primary-btn'" (click)="dialogRef.close(true)" [attr.data-testid]="data.testIdPrefix ? data.testIdPrefix + '-confirm-button' : null">
          {{ data.confirmLabel }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .primary-btn { background-color: #4f46e5 !important; color: white !important; border-radius: 0.5rem !important; }
    .warn-btn { background-color: #dc2626 !important; color: white !important; border-radius: 0.5rem !important; }
  `],
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
}
