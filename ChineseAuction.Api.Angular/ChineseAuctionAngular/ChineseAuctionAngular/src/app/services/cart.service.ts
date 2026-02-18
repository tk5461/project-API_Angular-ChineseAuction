import { Injectable, signal, computed, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  constructor() {
    effect(() => {
      const remaining = this.remainingTickets();
      const isModalOpen = this.ticketModalSignal();

      // Auto-close the modal when there are remaining tickets again.
      if (isModalOpen && remaining > 0) {
        this.closeTicketLimitModal();
      }
    });
  }
  // Package-related signals
  private quantitiesSignal = signal<Record<number, number>>({});
  private cartItemsSignal = signal<any[]>([]);

  packageQuantities = this.quantitiesSignal.asReadonly();
  cartItems = this.cartItemsSignal.asReadonly();

  // Gift-related signals
  private giftQuantitiesSignal = signal<Record<number, number>>({});
  private cartGiftsSignal = signal<any[]>([]);

  giftQuantities = this.giftQuantitiesSignal.asReadonly();
  cartGifts = this.cartGiftsSignal.asReadonly();

  // Available packages (full package definitions) to compute total tickets
  private availablePackagesSignal = signal<any[]>([]);
  availablePackages = this.availablePackagesSignal.asReadonly();

  totalGiftCount = computed(() => {
    const gQty = this.giftQuantitiesSignal();
    return Object.values(gQty).reduce((acc, v) => acc + (v || 0), 0);
  });

// בתוך CartService

// בתוך CartService
totalTickets = computed(() => {
  const pkgs = this.availablePackagesSignal();
  const quantities = this.quantitiesSignal();
  
  return Object.keys(quantities).reduce((acc, idStr) => {
    const id = Number(idStr);
    const pkg = pkgs.find(p => p.idPackage === id);
    if (pkg) {
      // סכימה מפורשת של רגיל + פרימיום
      const regular = pkg.amountRegular || 0;
      const premium = pkg.amountPremium || 0;
      return acc + ((regular + premium) * quantities[id]);
    }
    return acc;
  }, 0);
});

  // Total price for all packages currently in cart (price * quantity)
  private totalPriceSignal = computed(() => {
    const pkgs = this.availablePackagesSignal();
    const quantities = this.quantitiesSignal();
    return Object.keys(quantities).reduce((acc, idStr) => {
      const id = Number(idStr);
      const pkg = pkgs.find(p => p.idPackage === id || (p as any).id === id);
      const qty = quantities[id] || 0;
      const price = pkg ? (pkg.price || 0) : 0;
      return acc + (price * qty);
    }, 0);
  });

  // Template-friendly accessor used as cartService.totalPrice()
  totalPrice(): number {
    return this.totalPriceSignal();
  }



  // Ticket limit modal signals and message
  private ticketModalSignal = signal<boolean>(false);
  private ticketLimitMessageSignal = signal<string>('');
  private ticketModalSuppressedSignal = signal<boolean>(false);

  ticketModal = this.ticketModalSignal.asReadonly();
  ticketMessage = this.ticketLimitMessageSignal.asReadonly();

// עדכון פונקציית העזר לבדיקת אפשרות הוספה
canAddGift(n: number = 1): boolean {
  const totalAllowed = this.totalTickets();
  const alreadyUsed = this.totalGiftCount();
  if (totalAllowed <= 0) return false;
 return (alreadyUsed + n) <= totalAllowed;
}

  // Remaining tickets available for assigning to gifts
  remainingTickets = computed(() => {
    const tickets = this.totalTickets() || 0;
    const used = this.totalGiftCount() || 0;
    return Math.max(0, tickets - used);
  });

  // Helper: human-friendly ticket-limit message for UI tooltips/modals
  ticketLimitMessage(n: number = 1): string {
    const tickets = this.totalTickets();
    const used = this.totalGiftCount();
    if (!tickets || tickets <= 0) return 'אין לך כרטיסים בסל — יש לרכוש חבילות כרטיסים.';
    const missing = Math.max(0, (used + n) - tickets);
    return `אין מספיק כרטיסים. חסרים ${missing} כרטיסים.`;
  }

  openTicketLimitModal(message: string) {
    this.ticketLimitMessageSignal.set(message);
    this.ticketModalSignal.set(true);
  }

  closeTicketLimitModal(manual: boolean = false) {
    this.ticketModalSignal.set(false);
    if (manual) {
      this.ticketModalSuppressedSignal.set(true);
      setTimeout(() => this.ticketModalSuppressedSignal.set(false), 10000);
    }
  }
setQuantity(packageId: number, qty: number) {
  this.quantitiesSignal.update(current => {
    const updated = { ...current };
    if (qty <= 0) {
      delete updated[packageId];
    } else {
      updated[packageId] = qty;
    }
    return updated;
  });
  

  this.enforceGiftLimit(); 
}

  setCartItems(items: any[]) {
    this.cartItemsSignal.set(items);
  }

  setAvailablePackages(items: any[]) {
    this.availablePackagesSignal.set(items);
  }
setAllQuantities(quantities: Record<number, number>) {
  this.quantitiesSignal.set(quantities);
  // אכיפה לאחר עדכון מאסיבי
  this.enforceGiftLimit();
}

private enforceGiftLimit() {
  // 1. קבלת כמות הכרטיסים המקסימלית המעודכנת (לפי החבילות שיש כרגע בסל)
  const allowed = this.totalTickets(); 
  
  // 2. יצירת עותק של כמויות המתנות הנוכחיות כדי לעדכן אותן
  const giftQtys = { ...this.giftQuantitiesSignal() }; 
  
  // 3. חישוב סך המתנות שיש כרגע בסל
  let currentTotal = Object.values(giftQtys).reduce((acc, v) => acc + (v || 0), 0);

  // 4. בדיקה: אם אנחנו כבר בטווח המותר, אין צורך לעשות כלום
  if (currentTotal <= allowed) return;

  // 5. יצירת עותק של רשימת המתנות כדי לעדכן את התצוגה
  const giftsList = [...this.cartGiftsSignal()];

  /**
   * 6. לולאת הסרה: עוברים על רשימת המתנות מהסוף להתחלה (LIFO).
   * ממשיכים כל עוד סך המתנות גבוה מהמכסה המותרת.
   */
  for (let i = giftsList.length - 1; i >= 0 && currentTotal > allowed; i--) {
    const g = giftsList[i];
    const id = g.idGift;
    const qty = giftQtys[id] || 0;
    
    if (qty <= 0) continue;

    // חישוב כמה "עודף" יש לנו מעבר למותר
    const excess = currentTotal - allowed;
    // מחליטים כמה להסיר: או את כל הכמות של המתנה הזו, או רק את מה שחורג
    const remove = Math.min(qty, excess);
    const newQty = qty - remove;
    
    // עדכון הספירה הכוללת להמשך הלולאה
    currentTotal -= remove;

    if (newQty > 0) {
      // אם נשארה כמות, מעדכנים אותה
      giftQtys[id] = newQty;
      giftsList[i] = { ...g, amount: newQty };
    } else {
      delete giftQtys[id];
      giftsList.splice(i, 1);
    }
  }

  this.giftQuantitiesSignal.set(giftQtys);
  this.cartGiftsSignal.set(giftsList);
}
  // Gift management methods
  setGiftQuantity(giftId: number, qty: number) {
    this.giftQuantitiesSignal.update(current => {
      const updated = { ...current };
      if (qty <= 0) {
        delete updated[giftId];
      } else {
        updated[giftId] = qty;
      }
      return updated;
    });
  }

  setCartGifts(gifts: any[]) {
    this.cartGiftsSignal.set(gifts);
  }

  setAllGiftQuantities(quantities: Record<number, number>) {
    this.giftQuantitiesSignal.set(quantities);
  }

  clearCart() {
    this.quantitiesSignal.set({});
    this.cartItemsSignal.set([]);
    this.giftQuantitiesSignal.set({});
    this.cartGiftsSignal.set([]);
  }
  
}
