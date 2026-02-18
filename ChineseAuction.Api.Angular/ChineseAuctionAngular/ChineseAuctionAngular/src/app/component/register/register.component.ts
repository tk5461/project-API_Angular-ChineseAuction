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
    // Client-side validation: identity must be 9 digits
    const id = (this.userToRegister.identity || '').toString().trim();
    if (!/^[0-9]{9}$/.test(id)) {
      this.message = 'תעודת זהות לא תקינה — יש להזין 9 ספרות.';
      return;
    }

    this.authService.register(this.userToRegister).subscribe({
      next: (response) => {
        this.cartService.clearCart(); 
        // registration succeeded
        this.message = 'נרשמת בהצלחה למכירה הסינית!';
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      },
      error: (err) => {
        console.error('Registration error:', err);
        // Provide helpful messages for common server responses
        if (err) {
          // 409 Conflict often used for duplicate resources
          if (err.status === 409) {
            this.message = 'כתובת המייל כבר בשימוש — נא לבחור כתובת שונה.';
            return;
          }

          // 400 may include validation details
          if (err.status === 400) {
            const body = err.error;
            // If backend returns model state or errors object
            if (body && typeof body === 'object') {
              const text = JSON.stringify(body).toLowerCase();
              if (text.includes('email') || text.includes('duplicate')) {
                this.message = 'כתובת המייל כבר בשימוש — נא לבחור כתובת שונה.';
                return;
              }
              if (text.includes('identity') || text.includes('תעודת')) {
                this.message = 'תעודת זהות לא תקינה — יש להזין 9 ספרות.';
                return;
              }
            }

            const serverMsg = String(err.error || err.error?.message || '').toLowerCase();
            if (serverMsg.includes('email') || serverMsg.includes('duplicate') || serverMsg.includes('already')) {
              this.message = 'כתובת המייל כבר בשימוש — נא לבחור כתובת שונה.';
              return;
            }
            if (serverMsg.includes('identity') || serverMsg.includes('id') || serverMsg.includes('תעודת')) {
              this.message = 'תעודת זהות לא תקינה — יש להזין 9 ספרות.';
              return;
            }
          }
        }

        this.message = 'אופס... חלה שגיאה ברישום. נסה שוב.';
      }
    });
  }
}