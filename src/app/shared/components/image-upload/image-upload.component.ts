import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImagekitioAngularModule } from 'imagekitio-angular';
import { environment } from '@env/environment';
import { firstValueFrom } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, ImagekitioAngularModule],
  template: `
    <div class="image-upload">
      <ik-upload
        [folder]="'/cycles'"
        [useUniqueFileName]="true"
        [urlEndpoint]="urlEndpoint"
        [authenticator]="authenticator"
        [publicKey]="publicKey"
        (onError)="handleUploadError($event)"
        (onSuccess)="handleUploadSuccess($event)"
      ></ik-upload>
      <div class="image-preview" *ngIf="previewUrl">
        <img [src]="previewUrl" alt="Preview" />
        <button type="button" class="remove-image" (click)="removeImageHandler()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .image-upload {
      margin-top: 0.5rem;
    }

    .image-preview {
      margin-top: 1rem;
      position: relative;
      width: 150px;
      height: 150px;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }

    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .remove-image {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .remove-image:hover {
      background: rgba(255, 255, 255, 1);
      transform: scale(1.1);
    }

    :host ::ng-deep .ik-upload-button {
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    :host ::ng-deep .ik-upload-button:hover {
      background-color: #e9ecef;
    }
  `]
})
export class ImageUploadComponent {
  @Input() previewUrl: string | null = null;
  @Output() uploadSuccess = new EventEmitter<string>();
  @Output() uploadError = new EventEmitter<any>();
  @Output() removeImage = new EventEmitter<void>();

  urlEndpoint = environment.imageKit.urlEndpoint;
  publicKey = environment.imageKit.publicKey;
  
  authService = inject(AuthService);
  authenticator = () => firstValueFrom(this.authService.getImageKitAuth());



  handleUploadSuccess(event: any) {
    if (event?.url) {
      this.previewUrl = event.url;
      this.uploadSuccess.emit(event.url);
    }
  }

  handleUploadError(event: any) {
    this.uploadError.emit(event);
  }

  removeImageHandler() {
    this.previewUrl = null;
    this.removeImage.emit();
  }
}
