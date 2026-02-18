import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GiftService } from '../../services/gift.service';
import { CartService } from '../../services/cart.service';
import { Gift } from '../../models/GiftDTO';
import { interval, Subscription } from 'rxjs';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-raffle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './raffle.component.html',
  styleUrl: './raffle.component.scss'
})
export class RaffleComponent implements OnInit {
  private giftService = inject(GiftService);
  public cartService = inject(CartService);
  
  imageUrl = environment.apiUrl + '/images/gift/';
  gifts = signal<Gift[]>([]);
  currentGift = signal<Gift | null>(null);
  participants = signal<string[]>([]); 
  winnersList = signal<{ gift: string, winner: string }[]>([]);
  
  displayText = signal<string>('מוכנים?');
  isSpinning = signal<boolean>(false);
  selectedWinner = signal<string | null>(null);

  private spinSubscription?: Subscription;

  ngOnInit() {
    this.loadGifts();
    this.loadWinners();
  }

  loadWinners() {
    this.giftService.getWinners().subscribe({
      next: (list) => {
        const mapped = list.map(i => ({ gift: i.gift, winner: i.winnerName }));
        this.winnersList.set(mapped);
      },
      error: (err) => console.warn('Failed loading winners', err)
    });
  }

  loadGifts() {
    this.giftService.getAllGifts().subscribe({
      next: (data) => this.gifts.set(data),
      
      error: (err) => console.error('Error loading gifts', err)
    });
  }

  selectGift(gift: Gift) {
    if (this.isSpinning()) return;
    
    this.currentGift.set(gift);
    this.selectedWinner.set(null);
    this.displayText.set('טוען משתתפים...');
     if( gift.isDrawn)
     {        
      this.displayText.set('הפרס כבר הוגרל');
      return;
     }
    this.giftService.getParticipantsByGiftId(gift.idGift).subscribe({
      next: (names: any[]) => { 
        const mappedNames = names.map(p => (typeof p === 'object' ? p.firstName : p));
        
        this.participants.set(mappedNames);
        this.displayText.set(mappedNames.length > 0 ? 'מוכנים?' : 'אין משתתפים');
      },
      error: () => this.participants.set([])
    });
  }

  startRaffle() {
    if (this.participants().length === 0 || this.isSpinning()) return;

    this.isSpinning.set(true);
    this.selectedWinner.set(null);
    
    this.spinSubscription = interval(80).subscribe(() => {
      const names = this.participants();
      const randomIndex = Math.floor(Math.random() * names.length);
      this.displayText.set(names[randomIndex]);
    });
  }

stopRaffle() {
  const gift = this.currentGift();
  if (!gift || !this.isSpinning()) return;

  this.giftService.drawWinnerForGift(gift.idGift).subscribe({
    next: (res) => {
      this.spinSubscription?.unsubscribe();
      const winnerName = res.winnerName || `זוכה מספר ${res.winnerUserId}`;
      
      this.displayText.set(winnerName);
      this.selectedWinner.set(winnerName);
      this.isSpinning.set(false);
      
      // mark gift as drawn and attach winner id locally (avoid assigning partial user object)
      this.gifts.update(allGifts => 
        allGifts.map(g => g.idGift === gift.idGift ? { 
          ...g, 
          isDrawn: true, 
          idUser: res.winnerUserId ?? g.idUser
        } : g)
      );

      this.currentGift.update(curr => curr ? { 
        ...curr, 
        isDrawn: true, 
        idUser: res.winnerUserId ?? curr.idUser
      } : null);

      this.winnersList.update(prev => [
        { gift: gift.name, winner: winnerName },
        ...prev
      ]);

      this.giftService.getGiftById(gift.idGift).subscribe({
        next: (fresh) => {
          this.gifts.update(allGifts => allGifts.map(g => g.idGift === fresh.idGift ? fresh : g));
          this.currentGift.set(fresh);
        },
        error: (err) => {
          console.warn('Failed to refresh gift after draw', err);
        }
      });
    },

    error: (err) => {
      console.error('Error drawing winner', err);
      this.spinSubscription?.unsubscribe();
      this.displayText.set('אירעה שגיאה, נסו שוב');
      this.isSpinning.set(false);
    }
  
  });
}
  launchConfetti() {
    throw new Error('Method not implemented.');
  }

  exportWinnersReport() {
    if (this.winnersList().length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,מתנה,זוכה\n";
    this.winnersList().forEach(item => {
      csvContent += `${item.gift},${item.winner}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "winners_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}