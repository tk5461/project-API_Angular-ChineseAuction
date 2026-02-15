import { GiftCategoryDTO } from './CategoryDTO';
import { DonorDTO } from './DonorDTO';
import { UserDTO } from './UserDTO';

export class Gift {
  idGift: number = 0;
  name: string = '';
  description?: string = '';
  categoryId: number = 0;
  category?: GiftCategoryDTO;
  amount: number = 0; 
  image?: string = '';
  idDonor: number = 0;
  donor?: DonorDTO;
  isDrawn: boolean = false;
  idUser?: number;
  user?: UserDTO;
  price: number = 0;
  ordersGifts: any[] = [];
  totalPurchases?: number; 
  customerQuantity: number = 0; 

  constructor(init?: Partial<Gift>) {
    Object.assign(this, init);
    // מוודא שהערך מאותחל ל-0 בבנייה
    this.customerQuantity = this.customerQuantity || 0;
  }
}

// שאר ה-DTOs נשארים ללא שינוי
export class GiftDTO {
  idGift: number = 0;         // חובה לעדכון
  name: string = '';
  description?: string = '';
  categoryId: number = 0;     // ודאי שזה השם ב-C# (או IdGiftCategory)
  amount: number = 0;         // השם שהשרת מצפה לו
  image?: string = '';
  idDonor: number = 0;
  price: number = 0;

  constructor(init?: Partial<GiftDTO>) { 
    Object.assign(this, init); 
  }
}
export class GiftNewDTO {
  idGift: number = 0;
  name: string = '';
  description: string = '';
  price: number = 0;
  numOfBuyers: number = 0;
  constructor(init?: Partial<GiftNewDTO>) { Object.assign(this, init); }
}