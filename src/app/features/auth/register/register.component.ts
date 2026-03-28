import { Component, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest, ApiError } from '../../../core/models';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm_password')?.value;
  if (!password || !confirm) return null;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  registerForm = this.fb.group({
    organization_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
    display_name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirm_password: ['', [Validators.required]],
  }, {
    validators: [passwordMatchValidator],
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  togglePasswordVisibility(): void {
    this.hidePassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValue = this.registerForm.getRawValue();
    const request: RegisterRequest = {
      organization_name: formValue.organization_name!,
      display_name: formValue.display_name!,
      email: formValue.email!,
      password: formValue.password!,
    };

    this.authService.register(request).pipe(
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: () => {
        this.router.navigate(['/queries']);
      },
      error: (err) => {
        const apiError = err.error as ApiError['error'] | undefined;
        this.errorMessage.set(apiError?.message || 'An unexpected error occurred. Please try again.');
      },
    });
  }
}
