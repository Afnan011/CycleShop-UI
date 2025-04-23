import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { OrderService } from '../../services/order.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PaymentComponent implements OnInit {
  order: any;
  paymentMethod: 'cash' | 'stripe' = 'cash';
  processing = false;
  error = '';

  constructor(
    private router: Router,
    private paymentService: PaymentService,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    const orderData = history.state.order;
    console.log('Order data:', orderData);

    if (!orderData) {
      this.router.navigate(['/admin/pos']);
      return;
    }
    this.order = orderData;
  }

  async processPayment() {
    this.processing = true;
    this.error = '';

    try {
      const paymentRequest = {
        orderId: this.order.id,
        paymentType: this.paymentMethod,
        stripePaymentId: this.paymentMethod === 'stripe' ? 'pending' : null,
        receiptUrl: null
      };

      console.log('Payment request:', paymentRequest);
      console.log('Order ', this.order);

      if (this.paymentMethod === 'cash') {
        this.paymentService.processPayment(paymentRequest).subscribe({
          next: (response) => {
            console.log('Payment response:', response);
          },
          error: (err) => {
            console.error('Failed to process payment:', err);
            this.error = 'Failed to process payment';
          }
        });
        this.router.navigate(['/admin/dashboard/pos'], {
          state: {
            success: true,
            message: 'Payment processed successfully!'
          }
        });
      } else {
        // Handle Stripe payment implementation
        // You'll need to implement Stripe integration here
        this.error = 'Stripe payment not implemented yet';
      }
    } catch (err: any) {
      this.error = err.message || 'Failed to process payment';
    } finally {
      this.processing = false;
    }
  }


    public cancelPayment(): void {
      this.router.navigate(['/admin/dashboard/pos']);
    }
}
