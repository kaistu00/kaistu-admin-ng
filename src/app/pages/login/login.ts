import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export default class Login {
  private readonly auth = inject(AuthService);
  protected readonly isDev = environment.useEmulators;
  protected email = '';

  protected onSignIn(): void {
    if (this.isDev && this.email) {
      void this.auth.devLogin(this.email);
    } else {
      this.auth.signInWithGoogle();
    }
  }
}
