import { IncomeReport } from '../models/Income-report'; 
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { environment } from '../../../environment';
@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  
  // הכתובת הבסיסית לכל פעולות ההזמנה
  readonly BASE_URL = `${environment.apiUrl}/api/Orders`; 

  getUserOrders(userId: number): Observable<any> {
    console.log(`[OrderService] Fetching orders for userId: ${userId} from ${this.BASE_URL}/user/${userId}`);
    
    return this.http.get<any>(`${this.BASE_URL}/user/${userId}`).pipe(
      tap(res => console.log('[OrderService] Data received from server:', res))
    );
  }

  completeOrder(orderId: number): Observable<any> {
  return this.http.post(`${this.BASE_URL}/complete/${orderId}`, {}, { responseType: 'text' });
}

  addOrUpdateGiftInOrder(userId: number, giftId: number, amount: number): Observable<boolean> {
    const body = { userId, giftId, amount };
    return this.http.post<boolean>(`${this.BASE_URL}/add-gift`, body);
  }

  updatePackageQuantity(userId: number, packageId: number, quantity: number): Observable<boolean> {
    const body = { userId, packageId, quantity }; 
    return this.http.post<boolean>(`${this.BASE_URL}/update-package`, body);
  }

  deleteDraft(userId: number): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/draft/${userId}`).pipe(
      catchError((err: any) => {
        // Some backends respond 405 if DELETE on draft is not allowed; treat as benign
        if (err && err.status === 405) {
          console.warn('[OrderService] deleteDraft returned 405; treating as cleaned:', err);
          return of(null);
        }
        return throwError(() => err);
      })
    );
  }

  removeGiftFromDraft(userId: number, giftId: number): Observable<any> {
    const deleteUrl = `${this.BASE_URL}/draft/${userId}/gift/${giftId}`;
    const postRemoveUrl = `${this.BASE_URL}/remove-gift`;

    return this.http.delete(deleteUrl).pipe(
      catchError((err) => {
        console.warn('[OrderService] DELETE per-gift failed, trying POST /remove-gift', err);
        // Fallback: try POST /api/Orders/remove-gift { userId, giftId }
        return this.http.post(postRemoveUrl, { userId, giftId }).pipe(
          catchError((err2) => {
            console.warn('[OrderService] POST remove-gift also failed', err2);
            return throwError(() => err2 ?? err);
          })
        );
      })
    );
  }
  getPurchasersByGiftId(giftId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.BASE_URL}/purchasers/${giftId}`);
  }

  getIncomeReport(): Observable<IncomeReport> {
  return this.http.get<IncomeReport>(`${this.BASE_URL}/income-report`);
}
}

