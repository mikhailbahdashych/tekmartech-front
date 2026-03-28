import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { LoginRequest, ApiError } from '@core/models';
import { TkInputComponent } from '@shared/components/tk-input/tk-input.component';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkCardComponent } from '@shared/components/tk-card/tk-card.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TkInputComponent,
    TkButtonComponent,
    TkCardComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  infoMessage = signal<string | null>(null);
  hidePassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  togglePasswordVisibility(): void {
    this.hidePassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    const request = this.loginForm.getRawValue() as LoginRequest;

    this.authService.login(request).pipe(
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/queries';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        const apiError = err.error as ApiError['error'] | undefined;
        const code = (err.error as any)?.error?.code;
        if (code === 'auth.invitation_pending') {
          this.infoMessage.set('You have a pending invitation. Please check your email to accept it before logging in.');
        } else {
          this.errorMessage.set(apiError?.message || 'An unexpected error occurred. Please try again.');
        }
      },
    });
  }
}
