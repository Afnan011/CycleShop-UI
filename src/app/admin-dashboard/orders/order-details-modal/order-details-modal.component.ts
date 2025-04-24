import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Order } from '../../../services/order.service'; // Adjust the import path as necessary
import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'app-order-details-modal',
  templateUrl: './order-details-modal.component.html',
  styleUrls: ['./order-details-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class OrderDetailsModalComponent implements OnInit {

  @Input() order: Order | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() statusUpdate = new EventEmitter<string>();
  @Output() print = new EventEmitter<Order>();

  isEditingStatus = false;
  newStatus = '';
  payments: any[] = [];
  loadingPayments = false;
  paymentError = false;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    if (this.order && this.isOpen) {
      this.loadPayments();
    }
  }

  loadPayments(): void {
    if (!this.order || !this.order.orderId) return;
    
    this.loadingPayments = true;
    this.paymentError = false;
    this.payments = [];
    
    this.paymentService.getPaymentsByOrder(this.order.orderId).subscribe({
      next: (payments) => {
        this.payments = payments;
        this.loadingPayments = false;
      },
      error: (error) => {
        console.error('Error loading payment details:', error);
        this.paymentError = true;
        this.loadingPayments = false;
      }
    });
  }

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

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'succeeded': return 'status-completed';
      case 'failed': return 'status-cancelled';
      case 'requires_confirmation': return 'status-processing';
      case 'requires_payment': return 'status-pending';
      default: return '';
    }
  }

  formatPaymentType(type: string): string {
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown';
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
