import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Gift, GiftDTO, GiftNewDTO } from '../models/GiftDTO';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class GiftService {
  readonly BASE_URL = `${environment.apiUrl}/api/Gift`; 
  private http = inject(HttpClient);

  constructor() {}

  // 1. קבלת כל המתנות
  getAllGifts(): Observable<Gift[]> {
    return this.http.get<Gift[]>(this.BASE_URL);
  }

  // 2. קבלת מתנה לפי ID
  getGiftById(id: number): Observable<Gift> {
    return this.http.get<Gift>(`${this.BASE_URL}/${id}`);
  }

  // 3. יצירת מתנה חדשה
  createGift(dto: GiftDTO): Observable<Gift> {
    return this.http.post<Gift>(this.BASE_URL, dto);
  }

  // 4. עדכון מתנה קיימת
  updateGift(id: number, gift: GiftDTO): Observable<any> {
    return this.http.put(`${this.BASE_URL}/${id}`, gift);
  }

  // 5. מחיקת מתנה
  deleteGift(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.BASE_URL}/${id}`);
  }


  // 6. ביצוע ההגרלה האמיתית בשרת (תואם ל- [HttpPost("{id}/draw")])
  drawWinnerForGift(giftId: number): Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}/${giftId}/draw`, {});
  }

  // 7. קבלת שמות המשתתפים (עבור הרולטה ב-UI)
  getParticipantsByGiftId(giftId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.BASE_URL}/${giftId}/participants`);
  }

  // 8. חיפוש מתנה לפי שם (תואם ל- sort/word/{word})
  getByNameGift(word: string): Observable<Gift[]> {
    return this.http.get<Gift[]>(`${this.BASE_URL}/sort/word/${word}`);
  }

  // 9. חיפוש לפי שם תורם (תואם ל- sort/donor/{donor})
  getByNameDonor(donor: string): Observable<Gift[]> {
    return this.http.get<Gift[]>(`${this.BASE_URL}/sort/donor/${donor}`);
  }

  // 10. סינון לפי מספר רוכשים (תואם ל- sort/buyers/{buyers})
  getByNumOfBuyers(buyers: number): Observable<GiftNewDTO[]> {
    return this.http.get<GiftNewDTO[]>(`${this.BASE_URL}/sort/buyers/${buyers}`);
  }

  // 11. מיון לפי מחיר (תואם ל- sort/gift_price)
  sortByPrice(): Observable<Gift[]> {
    return this.http.get<Gift[]>(`${this.BASE_URL}/sort/gift_price`);
  }

  // 12. מיון לפי כמות אנשים (תואם ל- sort/amount_buyers)
  sortByAmountPeople(): Observable<Gift[]> {
    return this.http.get<Gift[]>(`${this.BASE_URL}/sort/amount_buyers`);
  }
  
  // 13. קבלת רשימת זוכים שמורה בשרת
  getWinners(): Observable<{ gift: string, winnerName: string, giftId: number, winnerUserId: number }[]> {
    return this.http.get<{ gift: string, winnerName: string, giftId: number, winnerUserId: number }[]>(`${this.BASE_URL}/winners`);
  }
  // 14. העלאת תמונה לשרת
  uploadImage(file: File): Observable<{ fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ fileName: string }>(`${this.BASE_URL}/upload`, formData);
  }
  // 15. קבלת מספר משתתפים במתנה
getParticipantsCount(giftId: number): Observable<number> {
  return this.http.get<any[]>(`${this.BASE_URL}/${giftId}/participants`)
    .pipe(
      map(data => {
        return data ? data.length : 0;
      }),
      catchError(() => of(0)) 
    );
}
}
