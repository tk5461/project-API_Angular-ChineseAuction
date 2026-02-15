import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { PackageService } from '../../../services/package.service';
import { PackageDTO, PackageCreateDTO } from '../../../models/PackageDTO';

@Component({
  selector: 'app-manage-packages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    MessageModule
  ],
  templateUrl: './manage-packages.component.html',
  styleUrls: ['./manage-packages.component.scss']
})
export class ManagePackagesComponent implements OnInit {
  private packageService = inject(PackageService);

  packages = signal<PackageDTO[]>([]);
  
  newPackage = signal<PackageCreateDTO>({
    name: '',
    amountRegular: 0,
    amountPremium: undefined,
    price: 0,
    description: ''
  });

  message = signal<string>('');
  messageType = signal<'success' | 'error'>('success');
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadPackages();
  }

  loadPackages(): void {
    this.isLoading.set(true);
    this.packageService.getAllPackages().subscribe({
      next: (data) => {
        this.packages.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading packages:', err);
        this.messageType.set('error');
        this.message.set('שגיאה בטעינת החבילות');
        this.isLoading.set(false);
      }
    });
  }

  addPackage(): void {
    const pkg = this.newPackage();

    if (!pkg.name || pkg.name.trim() === '') {
      this.messageType.set('error');
      this.message.set('יש להזין שם חבילה');
      return;
    }

    if (pkg.price < 0 || pkg.amountRegular < 0) {
      this.messageType.set('error');
      this.message.set('יש להזין ערכים חוקיים');
      return;
    }

    this.isLoading.set(true);
    this.packageService.createPackage(pkg).subscribe({
      next: (id) => {
        const created: PackageDTO = {
          idPackage: id,
          ...pkg
        };
        this.packages.set([...this.packages(), created]);
        this.newPackage.set({
          name: '',
          amountRegular: 0,
          amountPremium: undefined,
          price: 0,
          description: ''
        });
        this.messageType.set('success');
        this.message.set('חבילה נוצרה בהצלחה ✓');
        this.isLoading.set(false);
        setTimeout(() => this.message.set(''), 3000);
      },
      error: (err) => {
        console.error('Error creating package:', err);
        this.messageType.set('error');
        this.message.set('שגיאה בהוספת חבילה');
        this.isLoading.set(false);
      }
    });
  }

  deletePackage(packageId: number, packageName: string): void {
    if (confirm(`האם אתה בטוח שברצונך למחוק את החבילה "${packageName}"?`)) {
      this.isLoading.set(true);
      this.packageService.deletePackage(packageId).subscribe({
        next: () => {
          this.packages.set(this.packages().filter(p => p.idPackage !== packageId));
          this.messageType.set('success');
          this.message.set('חבילה נמחקה בהצלחה ✓');
          this.isLoading.set(false);
          setTimeout(() => this.message.set(''), 3000);
        },
        error: (err) => {
          console.error('Error deleting package:', err);
          this.messageType.set('error');
          this.message.set('שגיאה במחיקת חבילה');
          this.isLoading.set(false);
        }
      });
    }
  }
}
