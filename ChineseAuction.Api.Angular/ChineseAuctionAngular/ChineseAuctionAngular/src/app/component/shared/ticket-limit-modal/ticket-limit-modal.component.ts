import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-ticket-limit-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-limit-modal.component.html',
  styleUrls: ['./ticket-limit-modal.component.scss']
})
export class TicketLimitModalComponent {
  cartService = inject(CartService);
  private router = inject(Router);

  close() {
    this.cartService.closeTicketLimitModal(true);
  }

  goToPackages() {
    this.cartService.closeTicketLimitModal(true);
    this.router.navigate(['/package']);
  }
}


