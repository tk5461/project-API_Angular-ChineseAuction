import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { AuthService } from '../../services/auth.service';
import { DtoLogin } from '../../models/UserDTO';
import { ButtonModule } from 'primeng/button'; 
import { InputTextModule } from 'primeng/inputtext';
import { CartService } from '../../services/cart.service'; 
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { Router, RouterLink } from '@angular/router'; 
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, MessageModule, PasswordModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
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
export class RegisterComponent {

  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);

  userToRegister = new DtoLogin();
  message: string = '';

  onRegister() {
    this.authService.register(this.userToRegister).subscribe({
      next: (response) => {
        this.cartService.clearCart(); 
        // registration succeeded
        this.message = 'נרשמת בהצלחה למכירה הסינית!';
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1500);
      },
      error: (err) => {
        console.error('Registration error:', err);
        this.message = 'אופס... חלה שגיאה ברישום. נסה שוב.';
      }
    });
  }
}