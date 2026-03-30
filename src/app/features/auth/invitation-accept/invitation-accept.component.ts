import { Component, OnInit, signal, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { TkNotificationService } from '@shared/components/tk-notification/tk-notification.service';
import { finalize } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { TkInputComponent } from '@shared/components/tk-input/tk-input.component';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkCardComponent } from '@shared/components/tk-card/tk-card.component';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm_password')?.value;
  if (!password || !confirm) return null;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-invitation-accept',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TkInputComponent,
    TkButtonComponent,
    TkCardComponent,
  ],
  templateUrl: './invitation-accept.component.html',
  styleUrl: './invitation-accept.component.scss',
})
export class InvitationAcceptComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notify = inject(TkNotificationService);

  readonly token = signal<string | null>(null);
  readonly email = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly errorCode = signal<string | null>(null);
  readonly hidePassword = signal(true);
  readonly hideConfirmPassword = signal(true);
  readonly noToken = signal(false);

  readonly form = this.fb.group({
    display_name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirm_password: ['', [Validators.required]],
  }, {
    validators: [passwordMatchValidator],
  });

  togglePassword(): void { this.hidePassword.update(v => !v); }
  toggleConfirmPassword(): void { this.hideConfirmPassword.update(v => !v); }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const token = params.get('token');
    const email = params.get('email');

    if (!token) {
      this.noToken.set(true);
      return;
    }

    this.token.set(token);
    this.email.set(email);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const token = this.token();
    if (!token) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.errorCode.set(null);

    const formValue = this.form.getRawValue();

    this.authService.acceptInvitation({
      token,
      password: formValue.password!,
      display_name: formValue.display_name!,
    }).pipe(
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: () => {
        const orgName = this.authService.currentOrganization()?.name ?? 'the organization';
        this.notify.success(`Welcome to ${orgName}!`);
        this.router.navigate(['/new']);
      },
      error: (err) => {
        const code = err.error?.error?.code ?? '';
        const message = err.error?.error?.message ?? 'Failed to accept invitation.';
        this.errorCode.set(code);
        this.errorMessage.set(message);
      },
    });
  }
}
