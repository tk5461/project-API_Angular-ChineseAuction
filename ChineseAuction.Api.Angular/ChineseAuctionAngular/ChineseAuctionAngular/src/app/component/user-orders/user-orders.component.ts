import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { OrderDTO, OrderStatus } from '../../models/OrderDTO';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, BadgeModule, AvatarModule, DividerModule, ProgressSpinnerModule],
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.scss']
})
export class UserOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private userService = inject(AuthService);
  imageUrl = environment.apiUrl + '/images/gift/';

  public OrderStatus = OrderStatus;

  orders: OrderDTO[] = [];
  loading = false;
  expandedOrderId: number | null = null;

  ngOnInit(): void {
    const userId = this.userService.getUserId();
    if (userId) {
      this.loading = true;
      this.orderService.getUserOrders(userId).subscribe({
        next: (data: any) => {
          try {
            const mapped = Array.isArray(data) ? data.map((o: any) => new OrderDTO(o)) : (data ? [new OrderDTO(data)] : []);
            this.orders = mapped;
          } catch (e) {
            console.error('Error mapping orders', e);
            this.orders = [];
          }
        },
        error: (err) => {
          console.error('Failed loading user orders', err);
          this.orders = [];
        },
        complete: () => this.loading = false
      });
    }
  }

  viewOrder(order: OrderDTO): void {
    // toggle expanded details for this order (show gifts/packages)
    this.expandedOrderId = this.expandedOrderId === order.idOrder ? null : order.idOrder ?? null;
  }

  trackOrder(order: OrderDTO): void {
    console.log('Track order', order.idOrder);
  }

  cancelOrder(order: OrderDTO): void {
    if (order.status !== OrderStatus.Draft) {
      // cannot cancel non-draft orders
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete the order? This action cannot be undone.');
    if (!confirmed) return;

    const userId = this.userService.getUserId();
    if (!userId) return;

    this.loading = true;
    this.orderService.deleteDraft(userId).subscribe({
      next: () => {
        // remove the canceled draft from the list
        this.orders = this.orders.filter(o => o.idOrder !== order.idOrder);
      },
      error: (err) => {
        console.error('Failed to cancel order', err);
        alert('Failed to cancel order. Please try again later.');
      },
      complete: () => this.loading = false
    });
  }

  // helper: return human readable status label safely
  getStatusLabel(order?: OrderDTO): string {
    if (!order || order.status === undefined || order.status === null) return '';
    return OrderStatus[order.status] ?? '';
  }

  // helper: compute number of items in the order (gifts + packages)
  getItemsCount(order?: OrderDTO): number {
    if (!order) return 0;
    const gifts = order.ordersGifts?.reduce((s, g) => s + (g?.amount ?? 0), 0) ?? 0;
    const packs = order.ordersPackages?.reduce((s, p) => s + (p?.quantity ?? 0), 0) ?? 0;
    return gifts + packs;
  }

  // helper: compute total price if not provided by backend
  getOrderTotal(order?: OrderDTO): number {
    if (!order) return 0;
    if (order.totalPrice && order.totalPrice > 0) return order.totalPrice;
    const giftsTotal = order.ordersGifts?.reduce((s, g) => s + ((g?.price ?? 0) * (g?.amount ?? 0)), 0) ?? 0;
    const packsTotal = order.ordersPackages?.reduce((s, p) => s + ((p?.price ?? 0) * (p?.quantity ?? 0)), 0) ?? 0;
    return giftsTotal + packsTotal;
  }

  hasGifts(order?: OrderDTO): boolean {
    return !!(order && order.ordersGifts && order.ordersGifts.length > 0);
  }

  hasPackages(order?: OrderDTO): boolean {
    return !!(order && order.ordersPackages && order.ordersPackages.length > 0);
  }

}

