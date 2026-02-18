import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GiftService } from '../../../services/gift.service';
import { GiftCategoryService } from '../../../services/category.service';
import { GiftDTO } from '../../../models/GiftDTO';
import { GiftCategoryDTO } from '../../../models/CategoryDTO';

@Component({
  selector: 'app-add-gift',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-gift.component.html',
  styleUrl: './add-gift.component.scss'
})
export class AddGiftComponent implements OnInit {
  private giftService = inject(GiftService);
  private categoryService = inject(GiftCategoryService);

  @Input() donorId: number | null = null;
  @Output() giftAdded = new EventEmitter<void>();

  newGift: GiftDTO = new GiftDTO();
  categories: GiftCategoryDTO[] = [];
  
  uploadMode: 'file' | 'manual' = 'file';
  imagePreview: string | null = null;
  isUploading = false;
  isSubmitting = false;

  ngOnInit() {
    this.loadCategories();
    this.newGift.amount = 1; 
    this.newGift.categoryId = 0; 
    
    if (this.donorId) {
      this.newGift.idDonor = this.donorId;
    }
  }

  loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (data: GiftCategoryDTO[]) => this.categories = data,
      error: (err) => console.error("Error loading categories", err)
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => this.imagePreview = reader.result as string;
    reader.readAsDataURL(file);

    this.isUploading = true;
    this.giftService.uploadImage(file).subscribe({
      next: (res: any) => {
        this.newGift.image = res.fileName;
        this.isUploading = false;
      },
      error: () => {
        alert("העלאת התמונה נכשלה");
        this.isUploading = false;
      }
    });
  }

  saveGift() {
    this.isSubmitting = true;
    this.giftService.createGift(this.newGift).subscribe({
      next: () => {
        this.giftAdded.emit();
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error("Save error:", err);
        alert("שגיאה בשמירת המתנה - בדקי שהכמות חוקית (1-500)");
        this.isSubmitting = false;
      }
    });
  }
}