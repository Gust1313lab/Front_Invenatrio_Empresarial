import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';

  readonly loginForm = this.fb.nonNullable.group({
    identifier: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [true],
  });

  readonly identifierError = computed(() => {
    const control = this.loginForm.controls.identifier;

    if (control.hasError('required') && control.touched) {
      return 'Ingresa tu correo o usuario.';
    }

    if (control.hasError('minlength') && control.touched) {
      return 'Usa al menos 3 caracteres.';
    }

    return null;
  });

  readonly passwordError = computed(() => {
    const control = this.loginForm.controls.password;

    if (control.hasError('required') && control.touched) {
      return 'La contraseña es obligatoria.';
    }

    if (control.hasError('minlength') && control.touched) {
      return 'Usa al menos 6 caracteres.';
    }

    return null;
  });

  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.submitError.set(null);
    this.isSubmitting.set(true);

    const { identifier, password, rememberMe } = this.loginForm.getRawValue();

    this.authService
      .login({ identifier, password, rememberMe })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl(this.returnUrl || '/dashboard'),
        error: (error: unknown) => {
          this.submitError.set(this.mapErrorMessage(error));
        },
      });
  }

  private mapErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.includes('token')) {
      return 'La respuesta del servidor no incluyó un token válido.';
    }

    return 'No pudimos iniciar sesión. Verifica tus credenciales e intenta de nuevo.';
  }
}