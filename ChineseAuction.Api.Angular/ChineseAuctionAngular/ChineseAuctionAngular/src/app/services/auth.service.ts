import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DtoLogin, UserDTO } from '../models/UserDTO';
import { tap } from 'rxjs';
import { CartService } from './cart.service';
import { Router } from '@angular/router';
import { environment } from '../../../environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly BASE_URL = `${environment.apiUrl}/api/User`;
  private http = inject(HttpClient);
  private router = inject(Router);
  private cartService = inject(CartService);
  
  private readonly TOKEN_KEY = 'auth_token';
  private readonly MANAGER_KEY = 'is_manager'; 
  // consider stored strings 'null'/'undefined' as missing
  private initialToken = (() => {
    const t = localStorage.getItem('auth_token');
    if (!t || t === 'null' || t === 'undefined') return null;
    return t;
  })();

  isLoggedIn = signal<boolean>(!!this.initialToken);

  isManager = signal<boolean>(localStorage.getItem(this.MANAGER_KEY) === 'true');
  currentUserId = signal<number>(0);  

  constructor() {
  this.currentUserId.set(this.getUserIdFromToken());
  }

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }


  private checkAdminFromToken(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      return role === 'Admin' || role === 'Manager' || payload['IsManager'] === true;
    } catch {
      return false;
    }
  }
login(details: DtoLogin) {
  // הוספת responseType: 'text' אומרת לאנגולר לא לנסות להפוך את הטוקן ל-JSON
  return this.http.post(`${this.BASE_URL}/login`, details, { responseType: 'text' }).pipe(
    tap(token => {
      // validate token - backend may return null/empty
      if (!token || token === 'null' || token === 'undefined') {
        throw new Error('Invalid token received from server');
      }

      localStorage.setItem(this.TOKEN_KEY, token);

      // extract admin flag from token
      const isAdmin = this.checkAdminFromToken(token);
      localStorage.setItem(this.MANAGER_KEY, String(isAdmin));

      this.isLoggedIn.set(true);
      this.isManager.set(isAdmin);
      this.currentUserId.set(this.getUserIdFromToken());
    })
  );
}

  register(userInfo: UserDTO) {
    return this.http.post(`${this.BASE_URL}/register`, userInfo, { responseType: 'text' }).pipe(
      tap(token => {
        if (!token || token === 'null' || token === 'undefined') {
          throw new Error('Invalid token received from register');
        }
        localStorage.setItem(this.TOKEN_KEY, token);
        this.isLoggedIn.set(true);
        this.currentUserId.set(this.getUserIdFromToken());
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.MANAGER_KEY);
    this.isLoggedIn.set(false); 
    this.isManager.set(false);
    this.currentUserId.set(0);
    this.cartService.clearCart();
    this.router.navigate(['/login']);
  }


  private getUserIdFromToken(): number {
  const token = this.getToken();
  if (!token) {
    // ensure manager flag is cleared when there's no token
    this.isManager.set(false);
    localStorage.removeItem(this.MANAGER_KEY);
    return 0;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    const isAdmin = role === 'Manager' || role === 'Admin' || payload['IsManager'] === true;

    this.isManager.set(isAdmin);
    localStorage.setItem(this.MANAGER_KEY, String(isAdmin));

    const soapId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    return Number(soapId || 0);
  } catch {
    // parsing failed -> clear manager flag to avoid stale state
    this.isManager.set(false);
    localStorage.removeItem(this.MANAGER_KEY);
    return 0;
  }
}

  public getUserId(): number {
    return this.currentUserId();
  }
}

