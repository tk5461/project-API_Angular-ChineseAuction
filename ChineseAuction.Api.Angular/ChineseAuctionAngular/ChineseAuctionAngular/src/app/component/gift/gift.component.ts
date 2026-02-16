import { Component, OnInit, inject, signal, computed } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { GiftService } from '../../services/gift.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Gift } from '../../models/GiftDTO';
import { environment } from '../../../../environment';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gift',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gift.component.html',
  styleUrl: './gift.component.scss'
})
export class GiftComponent implements OnInit {
  imageUrl = environment.apiUrl + '/images/gift/';
  private giftService = inject(GiftService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);
  
  gifts = signal<Gift[]>([]);
  selectedGift = signal<Gift | null>(null);
  
  // סיגנלים לסינון (לשימוש מקומי או שליחה לשרת)
  categoryFilter = signal<string>('');
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  searchWord = signal<string>('');

  ngOnInit(): void {
    this.loadGifts();
  }

  loadGifts(): void {
    this.giftService.getAllGifts().subscribe({
      next: (data) => this.initializeGifts(data),
      error: (err) => console.error('Error loading gifts', err)
    });
  }

private initializeGifts(data: any[]): void {
  const initializedGifts = data.map(g => new Gift(g));
  this.gifts.set(initializedGifts);
}


  onSortByPrice(): void {
    this.giftService.sortByPrice().subscribe({
      next: (data) => this.initializeGifts(data)
    });
  }

  // מיון לפי פופולריות מהשרת
  onSortByPopularity(): void {
    this.giftService.sortByAmountPeople().subscribe({
      next: (data) => this.initializeGifts(data)
    });
  }

  // חיפוש לפי מילה מהשרת
  onSearchChange(event: Event): void {
    const word = (event.target as HTMLInputElement).value;
    this.searchWord.set(word);
    
    if (word.length > 1) {
      this.giftService.getByNameGift(word).subscribe({
        next: (data) => this.initializeGifts(data)
      });
    } else if (word.length === 0) {
      this.loadGifts();
    }
  }

  filterByNumOfBuyers(buyers: number): void {
    this.giftService.getByNumOfBuyers(buyers).subscribe({
      next: (data) => {
        const mapped = data.map(g => new Gift(g));
        this.gifts.set(mapped);
      }
    });
  }
  filteredGifts = computed(() => {
    return this.gifts().filter(gift => {
      const matchCategory = !this.categoryFilter() || gift.category?.name === this.categoryFilter();
      const min = this.minPrice() ?? 0;
      const max = this.maxPrice() ?? Infinity;
      const matchPrice = gift.price >= min && gift.price <= max;
      
      return matchCategory && matchPrice;
    });
  });

  // (ticket modal displayed via CartService)
  
  categories = computed(() => {
    const names = this.gifts().map(g => g.category?.name).filter(Boolean);
    return Array.from(new Set(names));
  });

  updateCategory(event: Event) {
    this.categoryFilter.set((event.target as HTMLSelectElement).value);
  }

  updateMinPrice(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.minPrice.set(val ? parseFloat(val) : null);
  }

  updateMaxPrice(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.maxPrice.set(val ? parseFloat(val) : null);
  }

  increaseQuantity(gift: Gift): void {
    // Block when limit reached - modal already auto-triggered by CartService effect
    if (!this.cartService.canAddGift(1)) {
      // If modal not showing yet, trigger it immediately
      if (this.cartService.remainingTickets() === 0 && !this.cartService.ticketModal()) {
        const tickets = this.cartService.totalTickets();
        const msg = tickets === 0 ? 'אין לך כרטיסים בסל — יש לרכוש חבילות כרטיסים.' : 'כל הכרטיסים שלך כבר בשימוש. יש לרכוש חבילות נוספות.';
        this.cartService.openTicketLimitModal(msg);
      }
      return;
    }

    const userId = this.authService.getUserId();
    this.orderService.addOrUpdateGiftInOrder(userId, gift.idGift, 1).subscribe({
      next: () => {
        const currentQty = this.cartService.giftQuantities()[gift.idGift] || gift.customerQuantity || 0;
        const newQty = currentQty + 1;
        const currentCart = [...this.cartService.cartGifts()];
        const idx = currentCart.findIndex(c => c.idGift === gift.idGift);
        if (idx >= 0) {
          const existing = currentCart[idx];
          currentCart[idx] = {
            ...existing,
            amount: newQty
          };
        } else {
          currentCart.push({
            idGift: gift.idGift,
            name: gift.name,
            price: gift.price,
            amount: newQty,
            image: gift.image,
            category: gift.category?.name || ''
          });
        }
        this.cartService.setCartGifts(currentCart);
        this.cartService.setGiftQuantity(gift.idGift, newQty);
      },
      error: (err) => {
        try {
          const status = err?.status;
          const code = err?.error?.code || err?.error;
          if (status === 400 && (code === 'INSUFFICIENT_TICKETS' || (typeof code === 'string' && code.includes('INSUFFICIENT_TICKETS')))) {
            // Trigger modal immediately on backend rejection if not already showing
            if (this.cartService.remainingTickets() === 0 && !this.cartService.ticketModal()) {
              const tickets = this.cartService.totalTickets();
              const msg = tickets === 0 ? 'אין לך כרטיסים בסל — יש לרכוש חבילות כרטיסים.' : 'כל הכרטיסים שלך כבר בשימוש. יש לרכוש חבילות נוספות.';
              this.cartService.openTicketLimitModal(msg);
            }
            return;
          }
        } catch (e) {
          // ignore
        }
        console.error('Error adding gift', err);
      }
    });
  }

  closeLimitModal() {
    this.cartService.closeTicketLimitModal();
  }

  goToPackages() {
    this.cartService.closeTicketLimitModal();
    this.router.navigate(['/package']);
  }

  decreaseQuantity(gift: Gift): void {

    const currentQty = this.cartService.giftQuantities()[gift.idGift] || gift.customerQuantity || 0;
    if (currentQty <= 0) return;
    const userId = this.authService.getUserId();

    this.orderService.addOrUpdateGiftInOrder(userId, gift.idGift, -1).subscribe({
      next: () => {
        const newQty = currentQty - 1;
        const currentCart = [...this.cartService.cartGifts()];
        const idx = currentCart.findIndex(c => c.idGift === gift.idGift);
        if (idx >= 0) {
          if (newQty > 0) {
            currentCart[idx] = { ...currentCart[idx], amount: newQty };
          } else {
            currentCart.splice(idx, 1);
          }
        } else if (newQty > 0) {
          currentCart.push({
            idGift: gift.idGift,
            name: gift.name,
            price: gift.price,
            amount: newQty,
            image: gift.image,
            category: gift.category?.name || ''
          });
        }
        this.cartService.setCartGifts(currentCart);
        this.cartService.setGiftQuantity(gift.idGift, newQty);
      }
    });
  }

getGiftQuantity(giftId: number): number {
  return this.cartService.giftQuantities()[giftId] || 0;
}


  openDetails(gift: Gift): void { this.selectedGift.set(gift); }
  closeDetails(): void { this.selectedGift.set(null); }
}
