import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImagekitioAngularModule } from 'imagekitio-angular';
import { environment } from '@env/environment';
import { firstValueFrom } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, ImagekitioAngularModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss'],
})
export class ImageUploadComponent implements AfterViewInit {
  @Input() previewUrl: string | null = null;
  @Output() uploadSuccess = new EventEmitter<string>();
  @Output() uploadError = new EventEmitter<any>();
  @Output() removeImage = new EventEmitter<void>();

  @ViewChild('ikUpload', { read: ElementRef }) ikUploadRef!: ElementRef;
  private fileInput!: HTMLInputElement;
  isDragOver = false;

  urlEndpoint = environment.imageKit.urlEndpoint;
  publicKey = environment.imageKit.publicKey;
  isUploading = false;

  authService = inject(AuthService);
  authenticator = () => firstValueFrom(this.authService.getImageKitAuth());

  ngAfterViewInit() {
    if (this.ikUploadRef) {
      this.fileInput =
        this.ikUploadRef.nativeElement.querySelector('input[type="file"]');
    }
  }

  triggerUpload() {
    if (this.fileInput) {
      this.fileInput.click();
      this.handleUploadStart();
    } else {
      console.warn('File input not found!');
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];

      if (this.fileInput) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        this.fileInput.files = dataTransfer.files;
        this.fileInput.dispatchEvent(new Event('change'));
      }
    }
  }

  handleUploadStart() {
    this.isUploading = true;   
  }

  handleUploadSuccess(event: any) {
    this.isUploading = false;
    if (event?.url) {
      this.previewUrl = event.url;
      this.uploadSuccess.emit(event.url);
    }
  }

  handleUploadError(event: any) {
    this.isUploading = false;
    this.uploadError.emit(event);
  }

  removeImageHandler() {
    this.previewUrl = null;
    this.removeImage.emit();
  }
}
