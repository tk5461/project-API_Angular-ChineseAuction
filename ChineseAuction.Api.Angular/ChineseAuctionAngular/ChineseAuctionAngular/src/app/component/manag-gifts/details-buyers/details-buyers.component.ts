import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GiftService } from '../../../services/gift.service';

@Component({
  selector: 'app-details-buyers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details-buyers.component.html'
})
export class DetailsBuyersComponent implements OnInit {
  @Input() giftId!: number;
  @Input() giftName: string = '';
  @Output() close = new EventEmitter<void>();

  private giftService = inject(GiftService);
  buyers = signal<any[]>([]);

  ngOnInit() {
    this.giftService.getParticipantsByGiftId(this.giftId).subscribe({
      next: (data) => {
        this.buyers.set(data);
      },
      error: (err) => console.error('Error loading buyers:', err)
    });
  }

  onClose() {
    this.close.emit();
  }
}