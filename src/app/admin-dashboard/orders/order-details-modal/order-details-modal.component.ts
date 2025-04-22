import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Order } from '../../../services/order.service'; // Adjust the import path as necessary

@Component({
  selector: 'app-order-details-modal',
  templateUrl: './order-details-modal.component.html',
  styleUrls: ['./order-details-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class OrderDetailsModalComponent  {

  @Input() order: Order | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() statusUpdate = new EventEmitter<string>();
  @Output() print = new EventEmitter<Order>();

  isEditingStatus = false;
  newStatus = '';

  closeModal(): void {
    this.close.emit();
    this.isEditingStatus = false;
  }

  updateOrderStatus(): void {
    this.statusUpdate.emit(this.newStatus);
    this.isEditingStatus = false;
  }

  printOrder(order: Order): void {
    this.print.emit(order);
  }

  formatAddress(address: any): string {
    if (!address) return '';
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  }

  isValidStatusTransition(): boolean {
    if (!this.newStatus || !this.order) return false;

    switch (this.order.status) {
        case 'pending':
            return ['processing', 'cancelled'].includes(this.newStatus);
        case 'processing':
            return ['completed', 'cancelled'].includes(this.newStatus);
        default:
            return false;
    }
}
}
