import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LucideAngularModule, ArrowLeft, ChevronRight } from 'lucide-angular';
import { IntegrationService } from '../../services/integration.service';
import { IntegrationType, IntegrationResponse, ConnectIntegrationPayload } from '../../models';
import { INTEGRATION_TYPE_CONFIG, AWS_REGIONS } from '../../constants/integration-config';

type DialogStep = 'type-selection' | 'credentials';

@Component({
  selector: 'app-connect-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    LucideAngularModule,
  ],
  templateUrl: './connect-dialog.component.html',
  styleUrl: './connect-dialog.component.scss',
})
export class ConnectDialogComponent {
  private fb = inject(FormBuilder);
  private integrationService = inject(IntegrationService);
  private dialogRef = inject(MatDialogRef<ConnectDialogComponent>);

  readonly icons = { ArrowLeft, ChevronRight };
  readonly typeConfig = INTEGRATION_TYPE_CONFIG;
  readonly awsRegions = AWS_REGIONS;
  readonly integrationTypes: IntegrationType[] = ['aws', 'github', 'google_workspace'];

  readonly step = signal<DialogStep>('type-selection');
  readonly selectedType = signal<IntegrationType | null>(null);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hidePassword = signal(true);

  // AWS form
  readonly awsForm = this.fb.group({
    display_name: ['', [Validators.required, Validators.maxLength(255)]],
    access_key_id: ['', [Validators.required]],
    secret_access_key: ['', [Validators.required]],
    region: ['', [Validators.required]],
  });

  // GitHub form
  readonly githubForm = this.fb.group({
    display_name: ['', [Validators.required, Validators.maxLength(255)]],
    personal_access_token: ['', [Validators.required]],
    organization: ['', [Validators.required]],
  });

  // Google Workspace form
  readonly googleForm = this.fb.group({
    display_name: ['', [Validators.required, Validators.maxLength(255)]],
    service_account_json: ['', [Validators.required]],
    delegated_email: [''],
  });

  selectType(type: IntegrationType): void {
    this.selectedType.set(type);
    this.step.set('credentials');
    this.errorMessage.set(null);
  }

  goBack(): void {
    this.step.set('type-selection');
    this.errorMessage.set(null);
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update(v => !v);
  }

  onSubmit(): void {
    const type = this.selectedType();
    if (!type) return;

    const form = this.getActiveForm();
    if (!form || form.invalid) {
      form?.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload = this.buildPayload(type, form.getRawValue());

    this.integrationService.connectIntegration(payload).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.dialogRef.close(response.integration);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.error?.message ?? 'Failed to connect integration. Please check your credentials.');
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  private getActiveForm() {
    switch (this.selectedType()) {
      case 'aws': return this.awsForm;
      case 'github': return this.githubForm;
      case 'google_workspace': return this.googleForm;
      default: return null;
    }
  }

  private buildPayload(type: IntegrationType, formValue: Record<string, any>): ConnectIntegrationPayload {
    const displayName = formValue['display_name'];

    switch (type) {
      case 'aws':
        return {
          type,
          display_name: displayName,
          credentials: {
            access_key_id: formValue['access_key_id'],
            secret_access_key: formValue['secret_access_key'],
            region: formValue['region'],
          },
        };
      case 'github':
        return {
          type,
          display_name: displayName,
          credentials: {
            personal_access_token: formValue['personal_access_token'],
            organization: formValue['organization'],
          },
        };
      case 'google_workspace':
        return {
          type,
          display_name: displayName,
          credentials: {
            service_account_json: formValue['service_account_json'],
            ...(formValue['delegated_email'] ? { delegated_email: formValue['delegated_email'] } : {}),
          },
        };
    }
  }
}
