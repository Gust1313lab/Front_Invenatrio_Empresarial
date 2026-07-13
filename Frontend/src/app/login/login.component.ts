import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, RegisterCredentials } from '../core/auth.service';

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
  readonly submitMessage = signal<string | null>(null);
  readonly isRegisterMode = signal(false);
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

  readonly loginForm = this.fb.nonNullable.group({
    identifier: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [true],
  });

  readonly registerForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['employee'],
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

  readonly registerUsernameError = computed(() => {
    const control = this.registerForm.controls.username;

    if (control.hasError('required') && control.touched) {
      return 'El usuario es obligatorio.';
    }

    if (control.hasError('minlength') && control.touched) {
      return 'Usa al menos 3 caracteres.';
    }

    return null;
  });

  readonly registerEmailError = computed(() => {
    const control = this.registerForm.controls.email;

    if (control.hasError('required') && control.touched) {
      return 'El correo es obligatorio.';
    }

    if (control.hasError('email') && control.touched) {
      return 'Ingresa un correo válido.';
    }

    return null;
  });

  readonly registerPasswordError = computed(() => {
    const control = this.registerForm.controls.password;

    if (control.hasError('required') && control.touched) {
      return 'La contraseña es obligatoria.';
    }

    if (control.hasError('minlength') && control.touched) {
      return 'Usa al menos 6 caracteres.';
    }

    return null;
  });

  toggleRegisterMode(): void {
    this.isRegisterMode.update((value) => !value);
    this.submitError.set(null);
    this.submitMessage.set(null);
    this.registerForm.patchValue({ role: 'employee' });
  }

  submit(): void {
    if (this.isRegisterMode()) {
      this.submitRegister();
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.submitError.set(null);
    this.submitMessage.set(null);
    this.isSubmitting.set(true);

    const { identifier, password, rememberMe } = this.loginForm.getRawValue();

    this.authService
      .login({ identifier, password, rememberMe })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (session) => {
          const landingRoute = this.authService.getLandingRoute(session.user?.role);
          void this.router.navigateByUrl(this.returnUrl || landingRoute);
        },
        error: (error: unknown) => {
          this.submitError.set(this.mapErrorMessage(error));
        },
      });
  }

  private submitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.submitError.set(null);
    this.submitMessage.set(null);
    this.isSubmitting.set(true);

    const payload = this.registerForm.getRawValue() as RegisterCredentials;

    this.authService
      .register(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.submitMessage.set(`Solicitud enviada para ${response.email ?? response.username ?? 'el usuario'}. Se creó con rol de empleado.`);
          this.isRegisterMode.set(false);
          this.registerForm.reset({ username: '', email: '', password: '', role: 'employee' });
        },
        error: () => {
          this.submitError.set('No pudimos crear la cuenta. Verifica los datos e intenta de nuevo.');
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