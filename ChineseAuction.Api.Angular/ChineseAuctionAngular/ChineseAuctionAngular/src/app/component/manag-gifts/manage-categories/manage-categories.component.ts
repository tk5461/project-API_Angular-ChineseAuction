import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { CategoryService } from '../../../services/category.service';
import { GiftCategoryDTO, CreateGiftCategoryDTO } from '../../../models/CategoryDTO';

@Component({
  selector: 'app-manage-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, MessageModule],
  templateUrl: './manage-categories.component.html',
  styleUrls: ['./manage-categories.component.scss']
})
export class ManageCategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);

  categories = signal<GiftCategoryDTO[]>([]);
  newCategoryName = signal<string>('');
  message = signal<string>('');
  messageType = signal<'success' | 'error'>('success');
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.categoryService.getAllCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.messageType.set('error');
        this.message.set('שגיאה בטעינת הקטגוריות');
        this.isLoading.set(false);
      }
    });
  }

  addCategory(): void {
    const trimmedName = this.newCategoryName().trim();
    
    if (!trimmedName) {
      this.messageType.set('error');
      this.message.set('יש להזין שם קטגוריה');
      return;
    }

    this.isLoading.set(true);
    const newCategory: CreateGiftCategoryDTO = { name: trimmedName };

    this.categoryService.createCategory(newCategory).subscribe({
      next: (created) => {
        this.categories.set([...this.categories(), created]);
        this.newCategoryName.set('');
        this.messageType.set('success');
        this.message.set('קטגוריה נוצרה בהצלחה ✓');
        this.isLoading.set(false);
        setTimeout(() => this.message.set(''), 3000);
      },
      error: (err) => {
        console.error('Error creating category:', err);
        this.messageType.set('error');
        this.message.set('שגיאה בהוספת קטגוריה');
        this.isLoading.set(false);
      }
    });
  }

  deleteCategory(categoryId: number, categoryName: string): void {
    if (confirm(`האם אתה בטוח שברצונך למחוק את הקטגוריה "${categoryName}"?`)) {
      this.isLoading.set(true);
      this.categoryService.deleteCategory(categoryId).subscribe({
        next: () => {
          this.categories.set(this.categories().filter(c => c.id !== categoryId));
          this.messageType.set('success');
          this.message.set('קטגוריה נמחקה בהצלחה ✓');
          this.isLoading.set(false);
          setTimeout(() => this.message.set(''), 3000);
        },
        error: (err) => {
          console.error('Error deleting category:', err);
          this.messageType.set('error');
          this.message.set('שגיאה במחיקת קטגוריה');
          this.isLoading.set(false);
        }
      });
    }
  }
}
