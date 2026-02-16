import { Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { RegisterComponent } from './component/register/register.component';
import { HomeComponent } from './component/home/home.component';
import { NotFoundComponent } from './component/not-found/not-found.component';
import { GiftComponent } from './component/gift/gift.component';
import { PackageComponent } from './component/package/package.component';
import { DonorComponent } from './component/donor/donor.component';
import { ManagerComponent } from './component/admin/manager/manager.component';
import { ManagGiftsComponent } from './component/manag-gifts/manag-gifts.component';
import { RaffleComponent } from './component/raffle/raffle.component';
import { BuyingComponent } from './component/buying/buying.component';
import { RevenueComponent } from './component/revenue/revenue.component';
import { UserOrdersComponent } from './component/user-orders/user-orders.component';
export const routes: Routes = [
    { path: 'login', component: LoginComponent, pathMatch: 'full' },
    { path: 'register', component: RegisterComponent, pathMatch: 'full' },
    { path: '', component: HomeComponent, pathMatch: 'full' },
    { path: 'gift', component: GiftComponent, pathMatch: 'full' },
    { path: 'package', component: PackageComponent, pathMatch: 'full' },
    { path: 'user-orders', component: UserOrdersComponent, pathMatch: 'full' },
    { path: 'about', loadComponent: () => import('./component/about/about.component').then(m => m.AboutComponent), pathMatch: 'full' },
    { path: 'manager', component: ManagerComponent,
        children: [
          { path: 'donor', component: DonorComponent, pathMatch: 'full' },
          { path: 'manage-gifts', component: ManagGiftsComponent, pathMatch: 'full' },
          { path: 'raffle', component: RaffleComponent, pathMatch: 'full' },
          { path: 'revenue', component: RevenueComponent, pathMatch: 'full' }
        ],
       },
    { path: 'buying', component: BuyingComponent, pathMatch: 'full' },
    
        { path: '**', component: NotFoundComponent, pathMatch: 'full' },
];
