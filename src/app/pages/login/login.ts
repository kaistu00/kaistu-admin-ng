import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export default class Login {
  private readonly auth = inject(AuthService);

  protected onSignIn(): void {
    void this.auth.signInWithGoogle();
  }
}
