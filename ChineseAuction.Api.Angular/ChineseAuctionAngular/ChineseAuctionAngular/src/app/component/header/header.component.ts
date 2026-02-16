import { Component, OnInit, inject, computed } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../../environment';
interface TabItem {
  title: string;
  value: string;
  adminOnly?: boolean;
  onlyLoggedOut?: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true, // חובה שיהיה true
  imports: [TabsModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class Header implements OnInit { 
  private router = inject(Router);
  public authService = inject(AuthService); 
  imageUrl = environment.apiUrl + '/images/main/';

  tabs: TabItem[] = [
    { title: 'החבילות', value: 'package' },
    { title: 'הפרסים', value: 'gift' },
    { title: 'על ההגרלה', value: 'about' },
    { title:  'דף הבית', value: '' },
    { title: 'הזמנות שלי', value: 'user-orders' },
    { title: 'ניהול', value: 'manager', adminOnly: true },
    { title: 'הרשמה', value: 'register', onlyLoggedOut: true },
    { title: 'כניסה', value: 'login', onlyLoggedOut: true },
    { title: 'רכישה', value: 'buying'},
    { title: 'התנתקות', value: 'logout' }
  ];

  ngOnInit() {

  }

  tabsSee = computed(() => {
    const isLogged = this.authService.isLoggedIn();
    const isAdmin = this.authService.isManager();

    return this.tabs.filter(tab => {
      // 1. הגנה על טאב ניהול: יוצג רק אם המשתמש מחובר וגם מנהל
      if (tab.adminOnly && (!isLogged || !isAdmin)) {
        return false;
      }

      // 2. הגנה על טאבים של אורחים בלבד (כניסה/הרשמה): יוסתרו אם המשתמש מחובר
      if (tab.onlyLoggedOut && isLogged) {
        return false;
      }

      // 3. הגנה על טאב התנתקות: יוסתר אם המשתמש לא מחובר
      if (tab.value === 'logout' && !isLogged) {
        return false;
      }
      
      return true;
    });
  });
  // // סינון הטאבים בצורה בטוחה לפי מצב המשתמש והמנהל
  // tabsSee = computed(() => {
  //   const isLogged = this.authService.isLoggedIn();
  //   const isAdmin = this.authService.isManager();

  //   return this.tabs.filter(tab => {
  //     // אם הטאב למנהלים בלבד והמשתמש אינו מנהל - הסתר
  //     if (tab.adminOnly && !isAdmin) return false;
  //     // אם הטאב מיועד רק למי שמנותק (כמו כניסה) והמשתמש מחובר - הסתר
  //     if (tab.onlyLoggedOut && isLogged) return false;
  //     // אם זה טאב התנתקות והמשתמש לא מחובר - הסתר
  //     if (tab.value === 'logout' && !isLogged) return false;
      
  //     return true;
  //   });
  // });

  onTabChange(value: string) {
    if (value === 'logout') {
      this.authService.logout(); 
    } else {
      this.router.navigate([value]);
    }
  }
}