import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, connectAuthEmulator } from 'firebase/auth';
import { environment } from '../../environments/environment';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  picture: string;
}

const KAISTU_DOMAIN = '@kaistu.com';
const KAISTU_EXTERNAL_URL = 'https://kaistu.com';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly user = signal<UserProfile | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly isInitialized = signal(false);

  private readonly auth = getAuth(initializeApp(environment.firebase));
  private readonly googleProvider = new GoogleAuthProvider();

  constructor() {
    if (environment.useEmulators) {
      connectAuthEmulator(this.auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    }
    void this.checkSession();
  }

  async signInWithGoogle(): Promise<void> {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      const idToken = await result.user.getIdToken();
      const profile = await lastValueFrom(this.http.post<UserProfile>('/api/auth/login', { idToken }));
      if (profile) {
        this.user.set(profile);
        await this.router.navigateByUrl('/');
      }
    } catch (err: unknown) {
      const httpErr = err as { status?: number; error?: { error?: string } };
      if (httpErr?.status === 403) {
        await signOut(this.auth);
        window.location.href = KAISTU_EXTERNAL_URL;
        return;
      }
      console.error('Sign in failed:', err);
    }
  }

  async signOut(): Promise<void> {
    try {
      await lastValueFrom(this.http.post('/api/auth/logout', {}));
      await signOut(this.auth);
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
