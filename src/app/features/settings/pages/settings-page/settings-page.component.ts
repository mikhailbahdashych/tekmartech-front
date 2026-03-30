import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TkNotificationService } from '@shared/components/tk-notification/tk-notification.service';
import { DatePipe } from '@angular/common';
import { Copy, Check } from 'lucide-angular';
import { TkInputComponent } from '@shared/components/tk-input/tk-input.component';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkSpinnerComponent } from '@shared/components/tk-spinner/tk-spinner.component';
import { TkBadgeComponent } from '@shared/components/tk-badge/tk-badge.component';
import { TkCardComponent } from '@shared/components/tk-card/tk-card.component';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { Organization } from '@core/models';
import { OrganizationService } from '@features/settings/services/organization.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'settings-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    TkInputComponent,
    TkButtonComponent,
    TkSpinnerComponent,
    TkBadgeComponent,
    TkCardComponent,
    TkIconComponent,
  ],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
})
export class SettingsPageComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private authService = inject(AuthService);
  private notify = inject(TkNotificationService);

  readonly icons = { Copy, Check };
  readonly org = signal<Organization | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly copied = signal(false);

  readonly nameControl = new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]);

  ngOnInit(): void {
    this.orgService.getOrganization().subscribe({
      next: (response) => {
        this.org.set(response.organization);
        this.nameControl.setValue(response.organization.name);
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); },
    });
  }

  saveName(): void {
    if (this.nameControl.invalid) return;
    this.isSaving.set(true);
    this.orgService.updateOrganization(this.nameControl.value!).subscribe({
      next: (response) => {
        this.org.set(response.organization);
        this.authService.currentOrganization.set(response.organization);
        this.isSaving.set(false);
        this.notify.success('Organization name updated');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notify.error(err.error?.error?.message ?? 'Failed to update name');
      },
    });
  }

  copyId(): void {
    const id = this.org()?.id;
    if (!id) return;
    navigator.clipboard.writeText(id);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
