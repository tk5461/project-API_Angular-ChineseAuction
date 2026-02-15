import { Component, Input, OnInit, inject, signal , computed } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GiftService } from '../../services/gift.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { Gift } from '../../models/GiftDTO';
import { Router , RouterLink} from '@angular/router';
import { environment } from '../../../../environment';
import { EditGiftComponent } from './edit-gift/edit-gift.component';
import { DropdownModule } from 'primeng/dropdown';
import { AddGiftComponent } from './add-gift/add-gift.component';
import { DetailsBuyersComponent } from '../manag-gifts/details-buyers/details-buyers.component';
import { ManageCategoriesComponent } from './manage-categories/manage-categories.component';
import { ManagePackagesComponent } from './manage-packages/manage-packages.component';
import { TabViewModule } from 'primeng/tabview';
@Component({
  selector: 'app-manag-gifts',
  imports: [CommonModule, FormsModule, DropdownModule, EditGiftComponent , AddGiftComponent, DetailsBuyersComponent, ManageCategoriesComponent, ManagePackagesComponent, TabViewModule],
  templateUrl: './manag-gifts.component.html',
  styleUrl: './manag-gifts.component.scss'
})
export class ManagGiftsComponent {
imageUrl = environment.apiUrl + '/images/gift/';  
  private router = inject(Router);
  editForm: any = {};
  @Input() gift: Gift | null = null;
  public giftService = inject(GiftService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  isEditModalVisible = signal<boolean>(false);
  gifts = signal<Gift[]>([]);
  selectedGift = signal<Gift | null>(null);
  showNoTicketsModal = signal<boolean>(false);
  isAddModalVisible = signal<boolean>(false);
  giftSearchText = signal<string>('');
  donorSearchText = signal<string>('');
  purchaseSearchCount = signal<number | null>(null);
  isBuyersModalVisible = signal<boolean>(false);

onGiftAdded() {
  this.loadGifts(); 
  this.isAddModalVisible.set(false); 
}

  ngOnInit(): void {
    this.loadGifts();
  }
ngOnChanges() {
    if (this.gift) {
      this.editForm = { ...this.gift }; 
    }
  }

  loadGifts(): void {
  this.giftService.getAllGifts().subscribe({
    next: (data) => {
      const initializedGifts = data.map(g => new Gift(g));
      this.gifts.set(initializedGifts);

      // טעינת כמות הרוכשים לכל מתנה בנפרד
      initializedGifts.forEach(gift => {
        this.giftService.getParticipantsCount(gift.idGift).subscribe(count => {
          gift.totalPurchases = count; 
        });
      });
    }
  });
}

filteredGifts = computed(() => {
  const giftText = this.giftSearchText().toLowerCase();
  const donorText = this.donorSearchText().toLowerCase();
  const minPurchases = this.purchaseSearchCount();

  return this.gifts().filter(g => {
    const matchGift = g.name.toLowerCase().includes(giftText);
    const donorName = (g.donor?.firstName + ' ' + (g.donor?.lastName || '')).toLowerCase();
    const matchDonor = donorName.includes(donorText);
    const matchPurchases = minPurchases === null || (g.totalPurchases || 0) >= minPurchases;
    
    return matchGift && matchDonor && matchPurchases;
  });
});

updatePurchaseSearch(event: Event) {
  const val = (event.target as HTMLInputElement).value;
  this.purchaseSearchCount.set(val ? parseInt(val) : null);
}
// פונקציות עדכון
updateGiftSearch(event: Event) {
  this.giftSearchText.set((event.target as HTMLInputElement).value);
}

updateDonorSearch(event: Event) {
  this.donorSearchText.set((event.target as HTMLInputElement).value);
}

  openDetails(gift: Gift): void {
    this.selectedGift.set(gift);
  }

  closeDetails(): void {
    this.selectedGift.set(null);
  }
onTabChange(event: any) {
}
 delete(gift: Gift): void {
  if (confirm(`האם אתה בטוח שברצונך למחוק את "${gift.name}"?`)) {
    this.giftService.deleteGift(gift.idGift).subscribe({ 
      next: () => {
        this.gifts.set(this.gifts().filter(g => g.idGift !== gift.idGift));
        this.closeDetails();
      },
      error: (err: any) => {
        console.error('שגיאה במחיקה', err);
      }
    });
  }
}

edit(gift: any): void {
    this.selectedGift.set(gift);
    this.isEditModalVisible.set(true);
  }

  onGiftSaved(updatedData: any) {
    this.loadGifts(); // מרענן את הרשימה מה-DB
    this.isEditModalVisible.set(false); // מוודא שהחלון נסגר
  }
// הוסף לפונקציות בתוך ה-class ManagGiftsComponent:

onSortChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  
  if (value === 'price') {
    this.giftService.sortByPrice().subscribe({
      next: (data) => {
        this.gifts.set(data.map(g => new Gift(g)));
        this.refreshPurchaseCounts(); // רענון מונה הרוכשים לאחר המיון
      }
    });
  } else if (value === 'buyers') {
    this.giftService.sortByAmountPeople().subscribe({
      next: (data) => {
        this.gifts.set(data.map(g => new Gift(g)));
        this.refreshPurchaseCounts();
      }
    });
  } else {
    this.loadGifts(); // חזרה לסדר רגיל
  }
}

// פונקציה תומכת לרענון מונים מבלי לטעון את כל הרשימה מחדש
private refreshPurchaseCounts() {
  this.gifts().forEach(gift => {
    this.giftService.getParticipantsCount(gift.idGift).subscribe(count => {
      gift.totalPurchases = count;
    });
  });
}
// הוסף ל-imports בראש הקובץ:

// בתוך ה-class:

viewBuyers(gift: Gift) {
  this.selectedGift.set(gift);
  this.isBuyersModalVisible.set(true);
}
}

