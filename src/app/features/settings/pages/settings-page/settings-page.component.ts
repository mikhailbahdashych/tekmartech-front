import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { LucideAngularModule, Copy, Check } from 'lucide-angular';
import { Organization } from '../../../../core/models';
import { OrganizationService } from '../../services/organization.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DatePipe,
    LucideAngularModule,
  ],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
})
export class SettingsPageComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

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
        this.snackBar.open('Organization name updated', 'Dismiss', { duration: 4000 });
      },
      error: (err) => {
        this.isSaving.set(false);
        this.snackBar.open(err.error?.error?.message ?? 'Failed to update name', 'Dismiss', { duration: 6000 });
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
