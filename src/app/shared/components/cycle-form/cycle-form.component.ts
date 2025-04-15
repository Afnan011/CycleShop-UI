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

  onSubmit() {
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
