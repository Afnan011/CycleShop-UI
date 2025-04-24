import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { OrderService, CreateOrderRequest } from '../../services/order.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { DOCUMENT } from '@angular/common';

// Declare Razorpay globally
declare global {
  interface Window {
    Razorpay: any;
  }
}

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
  paymentMethod: 'cash' | 'razorpay' | 'stripe' = 'cash';
  processing = false;
  error = '';
  private razorpayLoaded = false;

  constructor(
    private router: Router,
    private paymentService: PaymentService,
    private orderService: OrderService,
    private toastr: ToastrService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.loadRazorpayScript();
    
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

  private loadRazorpayScript() {
    if (!this.document.getElementById('razorpay-script')) {
      const script = this.document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Razorpay SDK loaded successfully');
        this.razorpayLoaded = true;
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay SDK');
        this.toastr.error('Failed to load payment gateway. Please try again later.');
      };
      this.document.body.appendChild(script);
    } else {
      this.razorpayLoaded = true;
    }
  }

  async processPayment() {
    this.processing = true;
    console.log('Processing payment with method:', this.paymentMethod);
    
    this.error = '';

    try {
      if (this.isPendingOrder) {
        // This is a pending order from the order form
        if (this.paymentMethod === 'razorpay') {
          await this.createOrderAndInitiateRazorpay();
        } else {
          await this.createAndProcessOrder();
        }
      } else {
        // This is a regular payment for an existing order
        if (this.paymentMethod === 'razorpay') {
          await this.processExistingOrderWithRazorpay();
        } else {
          await this.processExistingOrderPayment();
        }
      }
    } catch (err: any) {
      this.error = err.message || 'Failed to process payment';
      this.toastr.error(this.error);
      console.error('Payment error:', err);
    } finally {
      this.processing = false;
    }
  }

  private async createOrderAndInitiateRazorpay() {
    if (!this.pendingOrderData) {
      throw new Error('No order data available');
    }
    
    if (!this.razorpayLoaded) {
      throw new Error('Payment gateway is still loading. Please try again in a moment.');
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
    
    // Create the order first
    this.orderService.createOrder(orderRequest).subscribe({
      next: (createdOrder) => {
        console.log('Order created successfully:', createdOrder);
        
        // Initialize Razorpay for the created order
        const totalAmount = this.isPendingOrder ? 
          this.pendingOrderData.financialDetails.totalAmount : 
          createdOrder.totalAmount;
        
        if (!createdOrder.orderId) {
          throw new Error('Order ID is missing from the created order');
        }

        // Prepare Razorpay payment request
        const paymentRequest = {
          orderId: createdOrder.orderId,
          amount: Math.ceil(totalAmount),
          currency: 'INR'
        };
        
        this.initializeRazorpayForOrder(paymentRequest, createdOrder.orderId);
      },
      error: (err) => {
        console.error('Failed to create order:', err.error);
        this.error = 'Failed to create order';
        this.toastr.error(this.error, err.error);
      }
    });
  }
  
  private async processExistingOrderWithRazorpay() {
    if (!this.razorpayLoaded) {
      throw new Error('Payment gateway is still loading. Please try again in a moment.');
    }
    
    // Prepare Razorpay payment request for existing order
    const paymentRequest = {
      orderId: this.order.id,
      amount: Math.round(this.order.totalAmount * 100), // Razorpay expects amount in paise
      currency: 'INR'
    };
    
    this.initializeRazorpayForOrder(paymentRequest, this.order.id);
  }
  
  private initializeRazorpayForOrder(paymentRequest: any, orderId: string) {
    // Make API call to get Razorpay order ID
    this.paymentService.processRazorpayPayment(paymentRequest).subscribe({
      next: (response) => {
        console.log('Razorpay order created:', response);
        
        // Initialize Razorpay checkout
        const options = {
          key: response.razorpayKeyId, // Get this from the backend response
          amount: paymentRequest.amount,
          currency: paymentRequest.currency,
          name: 'EG Cycles',
          description: `Payment for Order #${orderId}`,
          order_id: response.razorpayOrderId, // Received from the backend
          handler: (response: any) => {
            console.log('Razorpay payment successful:', response);
            // Verify payment with backend
            const verificationData = {
              orderId: orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            };
            
            this.paymentService.verifyRazorpayPayment(verificationData).subscribe({
              next: (verifyResponse) => {
                console.log('Payment verification successful:', verifyResponse);
                this.toastr.success('Payment processed successfully!');
                this.router.navigate(['/admin/dashboard/orders'], {
                  state: {
                    success: true,
                    message: 'Order created and payment processed successfully!'
                  }
                });
              },
              error: (err) => {
                console.error('Payment verification failed:', err);
                this.error = 'Payment verification failed';
                this.toastr.error(this.error);
              }
            });
          },
          prefill: {
            name: this.isPendingOrder && this.pendingOrderData.orderInfo?.customer ? 
              `${this.pendingOrderData.orderInfo.customer.firstName} ${this.pendingOrderData.orderInfo.customer.lastName}` : '',
            email: this.isPendingOrder && this.pendingOrderData.orderInfo?.customer ?
              this.pendingOrderData.orderInfo.customer.email : '',
            contact: this.isPendingOrder && this.pendingOrderData.orderInfo?.customer ?
              this.pendingOrderData.orderInfo.customer.phoneNumber : ''
          },
          theme: {
            color: '#3399cc'
          },
          modal: {
            ondismiss: () => {
              console.log('Razorpay checkout dismissed');
              this.processing = false;
              this.toastr.warning('Payment cancelled');
            }
          }
        };
        
        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.open();
      },
      error: (err) => {
        console.error('Failed to create Razorpay order:', err);
        this.error = 'Failed to initialize payment gateway';
        this.toastr.error(this.error);
      }
    });
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
        console.error('Failed to create order:', err.error);
        this.error = 'Failed to create order';
        this.toastr.error(err.error, this.error);
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
