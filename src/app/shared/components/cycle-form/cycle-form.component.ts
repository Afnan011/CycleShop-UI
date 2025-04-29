import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Brand, CycleType } from '../../../models/cycle.model';
import { ImageUploadComponent } from '../image-upload/image-upload.component';

@Component({
  selector: 'app-cycle-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploadComponent],
  templateUrl: './cycle-form.component.html',
  styleUrls: ['./cycle-form.component.scss']
})
export class CycleFormComponent {
  @Input() formData: any = {};
  @Input() brands: Brand[] = [];
  @Input() types: CycleType[] = [];
  @Input() imageUrl: string | null = null;
  @Input() isEdit = false;

  @Output() formSubmit = new EventEmitter<any>();
  @Output() imageUploaded = new EventEmitter<string>();
  @Output() imageRemoved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() imageError = new EventEmitter<any>();

  // Track which fields have been touched by the user
  touchedFields: { [key: string]: boolean } = {
    modelName: false,
    brandName: false,
    typeName: false,
    price: false,
    costPrice: false,
    stockQuantity: false,
    reorderThreshold: false,
    warehouseLocation: false,
    description: false
  };

  // Mark a field as touched when user interacts with it
  markAsTouched(fieldName: string): void {
    this.touchedFields[fieldName] = true;
  }

  // Check if a field is invalid based on our validation rules
  isFieldInvalid(fieldName: string): boolean {
    switch(fieldName) {
      case 'modelName':
        return !this.formData.modelName?.trim();
      case 'brandName':
        return !this.formData.brandName;
      case 'typeName':
        return !this.formData.typeName;
      case 'price':
        return this.formData.price <= 0;
      case 'costPrice':
        return this.formData.costPrice <= 0;
      case 'stockQuantity':
        return this.formData.stockQuantity < 0;
      case 'reorderThreshold':
        return this.formData.reorderThreshold <= 0;
      case 'warehouseLocation':
        return !this.formData.warehouseLocation?.trim();
      case 'description':
        return !this.formData.description?.trim();
      default:
        return false;
    }
  }

  // Should show error if field is both touched and invalid
  shouldShowError(fieldName: string): boolean {
    return this.touchedFields[fieldName] && this.isFieldInvalid(fieldName);
  }

  onSubmit() {
    // Mark all fields as touched when submitting
    Object.keys(this.touchedFields).forEach(key => {
      this.touchedFields[key] = true;
    });
    
    if (this.validateForm()) {
      this.formSubmit.emit(this.formData);
    }
  }

  validateForm(): boolean {
    return (
      this.formData.modelName?.trim() !== '' &&
      this.formData.brandName !== '' &&
      this.formData.typeName !== '' &&
      this.formData.price > 0 &&
      this.formData.costPrice > 0 &&
      this.formData.stockQuantity >= 0 &&
      this.formData.reorderThreshold > 0 &&
      this.formData.warehouseLocation?.trim() !== '' &&
      this.formData.description?.trim() !== ''
    );
  }
  
  onImageUploadSuccess(url: string) {
    this.imageUrl = url;
    this.formData.imageUrl = url; 
    this.imageUploaded.emit(url);
    console.log('Image uploaded successfully:', url);
  }

  onImageRemove() {
    this.imageUrl = null;
    this.imageRemoved.emit();
  }
}
