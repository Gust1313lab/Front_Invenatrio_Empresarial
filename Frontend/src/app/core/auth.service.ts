import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, map, tap } from 'rxjs';

export type UserRole = 'admin' | 'employee' | string;

export interface LoginCredentials {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterResponse {
  id?: string;
  username?: string;
  email?: string;
  role?: UserRole;
  raw: unknown;
}

export interface AuthSession {
  token: string;
  expiresIn?: number;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  raw: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiBaseUrl = 'https://202302713.aplicacionesweb2026.com/api';
  private readonly storageKey = 'nova_flow_auth_token';
  private readonly roleStorageKey = 'nova_flow_auth_role';

  login(credentials: LoginCredentials): Observable<AuthSession> {
    const payload = {
      username: credentials.identifier,
      email: credentials.identifier,
      password: credentials.password,
    };

    return this.http.post<unknown>(`${this.apiBaseUrl}/auth/login`, payload).pipe(
      map((response) => this.normalizeSession(response)),
      tap((session) => this.storeSession(session, credentials.rememberMe))
    );
  }

  register(credentials: RegisterCredentials): Observable<RegisterResponse> {
    return this.http.post<unknown>(`${this.apiBaseUrl}/auth/register`, credentials).pipe(
      map((response) => this.normalizeRegisterResponse(response))
    );
  }

  logout(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.roleStorageKey);
    sessionStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.roleStorageKey);
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return localStorage.getItem(this.storageKey) ?? sessionStorage.getItem(this.storageKey);
  }

  hasToken(): boolean {
    return Boolean(this.getToken());
  }

  getRole(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return localStorage.getItem(this.roleStorageKey) ?? sessionStorage.getItem(this.roleStorageKey);
  }

  isAdmin(): boolean {
    return this.normalizeRole(this.getRole()) === 'admin';
  }

  isEmployee(): boolean {
    return this.normalizeRole(this.getRole()) === 'employee';
  }

  canManageUsers(): boolean {
    return this.isAdmin();
  }

  canManageProducts(): boolean {
    return this.isAdmin() || this.isEmployee();
  }

  canManageInventory(): boolean {
    return this.isAdmin() || this.isEmployee();
  }

  canEditProducts(): boolean {
    return this.isAdmin();
  }

  canEditInventory(): boolean {
    return this.isAdmin();
  }

  canDeleteProducts(): boolean {
    return this.isAdmin();
  }

  getLandingRoute(role: string | null | undefined = this.getRole()): string {
    return this.normalizeRole(role) === 'employee' ? '/employee-dashboard' : '/dashboard';
  }

  getAuthHeaders(): HttpHeaders | undefined {
    const token = this.getToken();

    if (!token) {
      return undefined;
    }

    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private storeSession(session: AuthSession, rememberMe: boolean): void {
    if (!isPlatformBrowser(this.platformId) || !session.token) {
      return;
    }

    sessionStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.roleStorageKey);
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.roleStorageKey);

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.storageKey, session.token);

    if (session.user?.role) {
      storage.setItem(this.roleStorageKey, session.user.role);
    }
  }

  private normalizeSession(response: unknown): AuthSession {
    const candidate = this.extractObject(response);
    const token =
      this.extractString(candidate, ['token', 'accessToken', 'jwt', 'authToken']) ??
      this.extractString(this.extractObject(candidate?.['data']), ['token', 'accessToken', 'jwt', 'authToken']) ??
      '';

    if (!token) {
      throw new Error('The API response did not include an authentication token.');
    }

    return {
      token,
      expiresIn: this.extractNumber(candidate, ['expiresIn', 'expires', 'ttl']) ?? undefined,
      user: this.extractUser(candidate),
      raw: response,
    };
  }

  private extractUser(candidate: Record<string, unknown> | null): AuthSession['user'] {
    if (!candidate) {
      return undefined;
    }

    const data = this.extractObject(candidate?.['data']);
    const user =
      this.extractObject(candidate?.['user']) ??
      this.extractObject(data?.['user']) ??
      candidate;

    if (!user) {
      return undefined;
    }

    return {
      id: this.extractString(user, ['id']) ?? undefined,
      name: this.extractString(user, ['name', 'fullName', 'username']) ?? undefined,
      email: this.extractString(user, ['email']) ?? undefined,
      role: this.extractString(user, ['role', 'profile']) ?? undefined,
    };
  }

  private normalizeRegisterResponse(response: unknown): RegisterResponse {
    const candidate = this.extractObject(response);

    return {
      id: this.extractString(candidate, ['id']) ?? undefined,
      username: this.extractString(candidate, ['username', 'name']) ?? undefined,
      email: this.extractString(candidate, ['email']) ?? undefined,
      role: this.extractString(candidate, ['role']) ?? undefined,
      raw: response,
    };
  }

  private normalizeRole(role: string | null): string | null {
    return role?.trim().toLowerCase() ?? null;
  }

  private extractObject(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  }

  private extractString(
    candidate: Record<string, unknown> | null | undefined,
    keys: string[]
  ): string | null {
    if (!candidate) {
      return null;
    }

    for (const key of keys) {
      const value = candidate[key];

      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private extractNumber(candidate: Record<string, unknown> | null | undefined, keys: string[]): number | null {
    if (!candidate) {
      return null;
    }

    for (const key of keys) {
      const value = candidate[key];

      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }

    return null;
  }
}