import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  picture: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly user = signal<UserProfile | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly isInitialized = signal(false);

  constructor() {
    void this.checkSession();
  }

  /** Dev login para emuladores locales — email con dominio @kaistu.com */
  async devLogin(email: string): Promise<void> {
    try {
      const profile = await lastValueFrom(this.http.post<UserProfile>('/api/auth/dev-login', { email }));
      if (profile) {
        this.user.set(profile);
        await this.router.navigateByUrl('/');
      }
    } catch (err: unknown) {
      const httpErr = err as { status?: number; error?: { error?: string } };
      if (httpErr?.status === 403) {
        window.location.href = 'https://kaistu.com';
        return;
      }
      console.error('Dev login failed:', err);
    }
  }

  /** Google OAuth — redirige al servidor para el flujo completo */
  signInWithGoogle(): void {
    window.location.href = '/api/auth/google';
  }

  async signOut(): Promise<void> {
    try {
      await lastValueFrom(this.http.post('/api/auth/logout', {}));
      this.user.set(null);
      await this.router.navigateByUrl('/login');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }

  private async checkSession(): Promise<void> {
    try {
      const profile = await lastValueFrom(this.http.get<UserProfile>('/api/auth/me'));
      if (profile) this.user.set(profile);
    } catch {
      this.user.set(null);
    } finally {
      this.isInitialized.set(true);
    }
  }
}
