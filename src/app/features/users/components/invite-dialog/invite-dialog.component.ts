import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../services/user.service';
import { InvitationResponse } from '../../models/user-management.model';

@Component({
  selector: 'app-invite-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title class="font-heading text-lg font-semibold text-slate-900">Invite User</h2>
    <mat-dialog-content>
      @if (errorMessage(); as error) {
        <div class="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{{ error }}</div>
      }
      <form [formGroup]="form" class="space-y-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email">
          @if (form.controls.email.hasError('required') && form.controls.email.touched) {
            <mat-error>Email is required</mat-error>
          }
          @if (form.controls.email.hasError('email') && form.controls.email.touched) {
            <mat-error>Please enter a valid email</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option value="member">Member</mat-option>
            <mat-option value="admin">Admin</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="isSubmitting()" (click)="dialogRef.close(null)">Cancel</button>
      <button mat-flat-button class="invite-btn" [disabled]="isSubmitting()" (click)="onSubmit()">
        @if (isSubmitting()) {
          <mat-spinner diameter="16" class="inline-spinner"></mat-spinner>
        } @else {
          Send Invitation
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .invite-btn {
      background-color: #4f46e5 !important; color: white !important; border-radius: 0.5rem !important;
      &[disabled] { opacity: 0.5; }
    }
    .inline-spinner { display: inline-block; }
    .inline-spinner ::ng-deep circle { stroke: white; }
  `],
})
export class InviteDialogComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  readonly dialogRef = inject(MatDialogRef<InviteDialogComponent>);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['member', [Validators.required]],
  });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, role } = this.form.getRawValue();
    this.userService.inviteUser(email!, role!).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.dialogRef.close(response.invitation);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.error?.message ?? 'Failed to send invitation.');
      },
    });
  }
}
