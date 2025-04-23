import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { OrderService, CreateOrderRequest } from '../../services/order.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PaymentComponent implements OnInit {
  order: any;
  isPendingOrder: boolean = false;
  pendingOrderData: any;
  paymentMethod: 'cash' | 'stripe' = 'cash';
  processing = false;
  error = '';

  constructor(
    private router: Router,
    private paymentService: PaymentService,
    private orderService: OrderService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    const state = history.state;
    console.log('Payment component state:', state);
    
    if (!state || !state.order) {
      this.router.navigate(['/admin/dashboard/pos']);
      return;
    }
    
    this.order = state.order;
    this.isPendingOrder = state.isPendingOrder || false;
    
    if (this.isPendingOrder) {
      this.pendingOrderData = this.order;
      console.log('Pending order data:', this.pendingOrderData);
    }
  }

  async processPayment() {
    this.processing = true;
    console.log('Processing payment with method:', this.paymentMethod);
    
    this.error = '';

    try {
      if (this.isPendingOrder) {
        // This is a pending order from the order form
        // First create the order, then process payment
        await this.createAndProcessOrder();
      } else {
        // This is a regular payment for an existing order
        await this.processExistingOrderPayment();
      }
    } catch (err: any) {
      this.error = err.message || 'Failed to process payment';
      this.toastr.error(this.error);
      console.error('Payment error:', err);
    } finally {
      this.processing = false;
    }
  }
  
  private async createAndProcessOrder() {
    if (!this.pendingOrderData) {
      throw new Error('No order data available');
    }
    
    // Prepare order request
    const orderRequest: CreateOrderRequest = {
      customerId: this.pendingOrderData.orderInfo.customerId,
      employeeId: this.pendingOrderData.orderInfo.employeeId,
      discount: this.pendingOrderData.orderInfo.discount,
      notes: this.pendingOrderData.orderInfo.notes,
      shippingAddressId: this.pendingOrderData.orderInfo.shippingAddressId,
      items: this.pendingOrderData.items.map((item: any) => ({
        cycleId: item.cycleId,
        quantity: item.quantity
      }))
    };
    
    console.log('Creating order with request:', orderRequest);
    
    // Create the order
    this.orderService.createOrder(orderRequest).subscribe({
      next: (createdOrder) => {
        console.log('Order created successfully:', createdOrder);
        
        // Now process payment for the created order
        const paymentRequest = {
          orderId: createdOrder.orderId,
          paymentType: this.paymentMethod,
          stripePaymentId: this.paymentMethod === 'stripe' ? 'pending' : null,
          receiptUrl: null
        };
        
        console.log('Processing payment:', paymentRequest);
        
        if (this.paymentMethod === 'cash') {
          this.paymentService.processPayment(paymentRequest).subscribe({
            next: (response) => {
              console.log('Payment processed successfully:', response);
              this.toastr.success('Order created and payment processed successfully!');
              this.router.navigate(['/admin/dashboard/orders'], {
                state: {
                  success: true,
                  message: 'Order created and payment processed successfully!'
                }
              });
            },
            error: (err) => {
              console.error('Failed to process payment:', err);
              this.error = 'Order was created but payment failed to process';
              this.toastr.error(this.error);
            }
          });
        } else {
          // Handle Stripe payment
          this.error = 'Stripe payment not implemented yet';
          this.toastr.warning(this.error);
        }
      },
      error: (err) => {
        console.error('Failed to create order:', err);
        this.error = 'Failed to create order';
        this.toastr.error(this.error);
      }
    });
  }
  
  private async processExistingOrderPayment() {
    const paymentRequest = {
      orderId: this.order.id,
      paymentType: this.paymentMethod,
      stripePaymentId: this.paymentMethod === 'stripe' ? 'pending' : null,
      receiptUrl: null
    };

    console.log('Payment request for existing order:', paymentRequest);

    if (this.paymentMethod === 'cash') {
      this.paymentService.processPayment(paymentRequest).subscribe({
        next: (response) => {
          console.log('Payment response:', response);
          this.toastr.success('Payment processed successfully!');
          this.router.navigate(['/admin/dashboard/pos'], {
            state: {
              success: true,
              message: 'Payment processed successfully!'
            }
          });
        },
        error: (err) => {
          console.error('Failed to process payment:', err);
          this.error = 'Failed to process payment';
          this.toastr.error(this.error);
        }
      });
    } else {
      // Handle Stripe payment implementation
      this.error = 'Stripe payment not implemented yet';
      this.toastr.warning(this.error);
    }
  }

  public cancelPayment(): void {
    if (this.isPendingOrder) {
      this.router.navigate(['/admin/dashboard/orders']);
    } else {
      this.router.navigate(['/admin/dashboard/pos']);
    }
  }
}
