import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { IncomeReport } from '../../models/Income-report';

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue.component.html',
  styleUrls: ['./revenue.component.scss']
})
export class RevenueComponent implements OnInit {
  private orderService = inject(OrderService);
  
  public reportData = signal<IncomeReport | null>(null);
  public loading = signal<boolean>(true);

  ngOnInit() {
    this.orderService.getIncomeReport().subscribe({
      next: (data) => {
        this.reportData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading.set(false);
      }
    });
  }

  getStats() {
    const data = this.reportData();
    if (!data) return [];

    return [
      {
        icon: '₪',
        label: 'סך הכנסות',
        value: data.totalRevenue?.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 }) || '₪0',
        class: 'revenue'
      },
      {
        icon: '👥',
        label: 'רוכשים',
        value: data.totalBuyers?.toString() || '0',
        class: 'buyers'
      },
      {
        icon: '🎁',
        label: 'תורמים',
        value: data.totalDonors?.toString() || '0',
        class: 'donors'
      }
    ];
  }
}

export { RevenueComponent as PurchasesComponent };