import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { TkInputComponent } from '@shared/components/tk-input/tk-input.component';
import { TkSelectComponent, TkSelectOption } from '@shared/components/tk-select/tk-select.component';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkSpinnerComponent } from '@shared/components/tk-spinner/tk-spinner.component';
import { UserService } from '@features/users/services/user.service';
import { InvitationResponse } from '@features/users/models/user-management.model';

@Component({
  selector: 'invite-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    TkInputComponent,
    TkSelectComponent,
    TkButtonComponent,
    TkSpinnerComponent,
  ],
  templateUrl: './invite-dialog.component.html',
  styleUrl: './invite-dialog.component.scss',
})
export class InviteDialogComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  readonly dialogRef = inject(MatDialogRef<InviteDialogComponent>);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly roleOptions: TkSelectOption[] = [
    { value: 'member', label: 'Member' },
    { value: 'admin', label: 'Admin' },
  ];

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
