import { Component, OnInit, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketLimitModalComponent } from '../shared/ticket-limit-modal/ticket-limit-modal.component';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { PackageService } from '../../services/package.service';
import { GiftService } from '../../services/gift.service';
import { Router } from '@angular/router';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  imageUrl = environment.apiUrl + '/images/packages/';
  giftImageUrl = environment.apiUrl + '/images/gift/';
  
  cartService = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private packageService = inject(PackageService);
  private giftService = inject(GiftService);
  private router = inject(Router);

  cartPackages = this.cartService.cartItems;
  packageQuantities = this.cartService.packageQuantities;
  cartGifts = this.cartService.cartGifts;
  giftQuantities = this.cartService.giftQuantities;
  
  allAvailablePackages = signal<any[]>([]);
  allAvailableGifts = signal<any[]>([]);

  constructor() {}

ngOnInit() {
  this.packageService.getAllPackages().subscribe((pkgs: any[]) => {
    this.allAvailablePackages.set(pkgs);
    this.cartService.setAvailablePackages(pkgs);
    
    this.giftService.getAllGifts().subscribe((gifts: any[]) => {
      this.allAvailableGifts.set(gifts);
      
      const userId = this.authService.getUserId();
      if (userId > 0) {
        this.loadCart();
      }
    });
  });
}

  loadCart() {
  const userId = this.authService.getUserId();
  if (userId > 0) {
    this.orderService.getUserOrders(userId).subscribe({
      next: (orders: any[]) => {
        const draft = orders?.find((o: any) => o.status === 0);
        if (draft) {
          if (draft.ordersPackages) {
            const qtys: Record<number, number> = {};
            
            const enrichedPackages = draft.ordersPackages.map((item: any) => {
              const fullInfo = this.allAvailablePackages().find(p => p.idPackage === item.idPackage);
              qtys[item.idPackage] = item.quantity;
              return {
                ...item,
                price: fullInfo?.price || item.price || 0
              };
            });

            this.cartService.setAllQuantities(qtys);
            this.cartService.setCartItems(enrichedPackages);
          }

          if (draft.ordersGifts) {
            const giftQtys: Record<number, number> = {};
            
            const enrichedGifts = draft.ordersGifts.map((item: any) => {
              const candidateIds: number[] = [];
              if (item.idGift && item.idGift > 0) candidateIds.push(item.idGift);
              if (item.id && item.id > 0) candidateIds.push(item.id);
              if ((item as any).giftId && (item as any).giftId > 0) candidateIds.push((item as any).giftId);
              if (item.gift && (item.gift.idGift || item.gift.id)) {
                const nestedId = item.gift.idGift || item.gift.id;
                if (nestedId > 0) candidateIds.push(nestedId);
              }

              let fullInfo = null as any;
              if (candidateIds.length) {
                fullInfo = this.allAvailableGifts().find((g: any) => candidateIds.includes(g.idGift));
              }

              if (!fullInfo && item.name) {
                const nm = (item.name || '').toString().trim().toLowerCase();
                if (nm) fullInfo = this.allAvailableGifts().find((g: any) => (g.name || '').toString().trim().toLowerCase() === nm);
              }

              if (!fullInfo) fullInfo = undefined;

              const resolvedId = (item.idGift && item.idGift > 0) ? item.idGift : (fullInfo?.idGift || 0);
              giftQtys[resolvedId] = item.amount || 0;

              let imageToUse = '';
              if (fullInfo?.image && fullInfo.image !== 'string' && fullInfo.image.trim()) imageToUse = fullInfo.image;
              if (!imageToUse && item.image && item.image !== 'string' && (item.image + '').trim()) imageToUse = item.image;

              return {
                idGift: resolvedId,
                name: fullInfo?.name || item.name || '',
                price: fullInfo?.price || item.price || 0,
                amount: item.amount || 0,
                image: imageToUse,
                category: fullInfo?.category?.name || item.category || ''
              };
            });

            this.cartService.setAllGiftQuantities(giftQtys);
            this.cartService.setCartGifts(enrichedGifts);
          }
          
          this.calculateTotal(); 
        }
      }
    });
  }
}



  increment(id: number) {
    this.updateQty(id, (this.packageQuantities()[id] || 0) + 1);
  }

  decrement(id: number) {
    const current = this.packageQuantities()[id] || 0;
    if (current > 0) {
      this.updateQty(id, current - 1);
    }
  }

  private updateQty(idPackage: number, newQty: number) {
    const userId = this.authService.getUserId();

    // If not logged in, just apply locally
    if (!userId || userId <= 0) {
      this.cartService.setQuantity(idPackage, newQty);
      if (newQty === 0) {
        this.cartService.clearCart();
      }
      return;
    }

    // Logged-in: update server, but don't reload full cart on zero (that may repopulate stale server draft)
    const prevQty = this.packageQuantities()[idPackage] || 0;
    const prevCart = [...this.cartService.cartItems()];
    this.orderService.updatePackageQuantity(userId, idPackage, newQty).subscribe({
      next: () => {
        this.cartService.setQuantity(idPackage, newQty);
        if (newQty === 0) {
          const confirmMsg = 'זו החבילה האחרונה בסל — האם אתה בטוח שברצונך למחוק את כל מה שיש בסל?';
          const ok = window.confirm(confirmMsg);
          if (!ok) {
            // user cancelled: revert optimistic change
            this.cartService.setQuantity(idPackage, prevQty);
            this.cartService.setCartItems(prevCart);
            return;
          }

          // user confirmed: Clear local cart and attempt to remove gifts on the server too.
          const currentGifts = [...this.cartService.cartGifts()];
          this.cartService.clearCart();
          currentGifts.forEach(g => {
            try {
              const gid = g.idGift || g.id || 0;
              const qty = (g.amount || this.giftQuantities()[gid] || 0);
              if (gid > 0) {
                // Prefer explicit delete endpoint; fallback to negative-delta update if not supported
                this.orderService.removeGiftFromDraft(userId, gid).subscribe({
                  next: () => {},
                  error: (err) => {
                    console.warn('removeGiftFromDraft failed, falling back to negative update', gid, err);
                    if (qty > 0) {
                      this.orderService.addOrUpdateGiftInOrder(userId, gid, -qty).subscribe({
                        next: () => {},
                        error: (err2) => console.warn('Fallback remove failed', gid, err2)
                      });
                    }
                  }
                });
              }
            } catch (e) {
              console.warn('Error during server gift cleanup', e);
            }
          });

          // Also try deleting draft; if that fails, we already attempted per-gift removals.
          this.orderService.deleteDraft(userId).subscribe({
            next: () => {},
            error: (err) => {
              console.warn('deleteDraft failed after local clear and per-gift removals', err);
            }
          });
        }
      },
      error: (err) => console.error('Error updating quantity', err)
    });
  }

  incrementGift(idGift: number) {
    const totalTickets = this.cartService.totalTickets();
    const totalGifts = this.cartService.totalGiftCount();
    // Enforce ticket limits before increasing, show modal when limit reached
    if (!this.cartService.canAddGift(1)) {
      const tickets = this.cartService.totalTickets();
      const used = this.cartService.totalGiftCount();
      const missing = Math.max(0, (used + 1) - tickets);
      const msg = tickets === 0
        ? 'אין לך כרטיסים בסל — יש לרכוש חבילות כרטיסים.'
        : `אין מספיק כרטיסים. חסרים ${missing} כרטיסים.`;
      this.cartService.openTicketLimitModal(msg);
      return;
    }
    this.updateGiftQty(idGift, (this.giftQuantities()[idGift] || 0) + 1);
  }
      
decrementGift(idGift: number) {
  const current = this.giftQuantities()[idGift] || 0;
  if (current > 0) {
    this.updateGiftQty(idGift, current - 1);
  }
}

  private updateGiftQty(idGift: number, newQty: number) {
    const userId = this.authService.getUserId();
    this.orderService.addOrUpdateGiftInOrder(userId, idGift, newQty).subscribe({
      next: () => {
        this.cartService.setGiftQuantity(idGift, newQty);
        if (newQty === 0) {
          this.loadCart();
        }
      },
      error: (err) => {
        // If backend rejects due to insufficient tickets, show the ticket modal
        try {
          const status = err?.status;
          const code = err?.error?.code || err?.error;
          if (status === 400 && (code === 'INSUFFICIENT_TICKETS' || (typeof code === 'string' && code.includes('INSUFFICIENT_TICKETS')))) {
            const tickets = this.cartService.totalTickets();
            const used = this.cartService.totalGiftCount();
            const missing = Math.max(0, (used + 1) - tickets);
            const msg = tickets === 0
              ? 'אין לך כרטיסים בסל — יש לרכוש חבילות כרטיסים.'
              : `אין מספיק כרטיסים. חסרים ${missing} כרטיסים.`;
            this.cartService.openTicketLimitModal(msg);
            return;
          }
        } catch (e) {
          // ignore parsing errors
        }

        console.error('Error updating gift quantity', err);
      }
    });
  }

  getPackageImage(id: number): string {
    const images = ['p-green.png', 'p-blue.png', 'p-pink.png', 'p-red.png'];
    return images[id % images.length];
  }

  calculateTotal(): number {
    const packagesTotal = this.cartPackages().reduce((acc, pkg) => {
      const qty = this.packageQuantities()[pkg.idPackage] || 0;
      const price = pkg.price || 0;
      return acc + (price * qty);
    }, 0);
    return packagesTotal;
  }

  goToPackages() {
    this.cartService.closeTicketLimitModal();
    this.router.navigate(['/package']);
  }
}
