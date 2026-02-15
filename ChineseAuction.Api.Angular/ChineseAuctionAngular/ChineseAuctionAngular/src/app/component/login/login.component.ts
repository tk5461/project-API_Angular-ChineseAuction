import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DtoLogin } from '../../models/UserDTO';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-login',
  standalone: true, 
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, MessageModule, PasswordModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('500ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);

  userToLogin = new DtoLogin();
  message: string = '';

  onLogin() {
    this.authService.login(this.userToLogin).subscribe({
      next: (response) => {
        this.cartService.clearCart(); 
        // login succeeded
        this.message = 'התחברת בהצלחה!';
        setTimeout(() => this.router.navigate(['/home']), 1000);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.message = 'אופס... חלה שגיאה בהתחברות. נסה שוב.';
      }
    });
  }
}