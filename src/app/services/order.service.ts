import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Order-related interfaces
export interface Customer {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  shippingAddressId?: string;
}

export interface Address {
  addressId: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Brand {
  brandId: string;
  name: string;
}

export interface CycleType {
  typeId: string;
  name: string;
}

export interface Cycle {
  cycleId: string;
  modelName: string;
  brandId: string;
  sku:string;
  brand: Brand;
  typeId: string;
  type: CycleType;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
}

export interface OrderItem {
  orderItemId?: string;
  orderId?: string;
  cycleId: string;
  cycle?: Cycle;
  quantity: number;
  priceSnapshot: number;
  taxRate?: number;
  totalPrice?: number;
}

export type statusType = "pending" | "processing" | "completed" | "cancelled" | "refunded";

export interface Order {
  orderId?: string;
  orderNumber?: string;
  employeeId?: string;
  customerId: string;
  customer?: Customer;
  shippingAddressId?: string;
  shippingAddress?: Address;
  orderDate?: Date;
  status?: statusType;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  notes?: string;
  orderItems: OrderItem[];
}

export interface CreateOrderRequest {
  customerId: string;
  employeeId: string;
  shippingAddressId?: string;
  discount?: number;
  notes?: string;
  items: {
    cycleId: string;
    quantity: number;
  }[];
}

export interface UpdateOrderStatusRequest {
  status: string;
}

export interface Inventory {
  cycleId: string;
  stockQuantity: number;
  reorderThreshold: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
      throw new Error('No authentication token found. Please log in.');
    }
    const currentUser = JSON.parse(currentUserStr);
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentUser.token}`
    });
  }

  // CRUD Operations
  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`, { headers: this.getAuthHeaders() });
  }

  getOrderById(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${orderId}`, { headers: this.getAuthHeaders() });
  }

  getOrdersByCustomer(customerId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/customer/${customerId}`, { headers: this.getAuthHeaders() });
  }

  getOrdersByEmployee(employeeId: string, filters?: any): Observable<Order[]> {
    let url = `${this.apiUrl}/orders/employee/${employeeId}/orders`;
    
    // Create HttpParams object for query parameters
    let params = new HttpParams();
    
    // Add query parameters for filters if provided
    if (filters) {
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      
      if (filters.startDate) {
        params = params.set('startDate', filters.startDate);
      }
      
      if (filters.endDate) {
        params = params.set('endDate', filters.endDate);
      }
    }
    
    return this.http.get<Order[]>(url, { 
      headers: this.getAuthHeaders(),
      params: params
    });
  }

  createOrder(orderRequest: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, orderRequest, { headers: this.getAuthHeaders() });
  }

  updateOrderStatus(orderId: string, statusRequest: UpdateOrderStatusRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${orderId}/status`, statusRequest, { headers: this.getAuthHeaders() });
  }

  getInventoryForCycle(cycleId: string): Observable<Inventory> {
    return this.http.get<Inventory>(`${this.apiUrl}/Inventory/cycle/${cycleId}`);
  }

  getAllCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.apiUrl}/customers`, { headers: this.getAuthHeaders() });
  }

  getCustomerAddresses(customerId: string): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiUrl}/customers/${customerId}/addresses`, { headers: this.getAuthHeaders() });
  }

  getAllCycles(): Observable<Cycle[]> {
    return this.http.get<Cycle[]>(`${this.apiUrl}/cycles`, { headers: this.getAuthHeaders() });
  }

  formatAddress(address: Address): string {
    if (!address) return 'No address provided';
    return `${address.street}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
  }

  // Print functionality
  printOrder(order: Order): void {
    console.log('Printing order', order);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // First get payment details
      this.http.get<any[]>(`${this.apiUrl}/payments/order/${order.orderId}`, { headers: this.getAuthHeaders() })
        .subscribe((payments) => {
          const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null;

          printWindow.document.write(`
            <html>
              <head>
                <title>Order #${order.orderNumber}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  .print-header { text-align: center; margin-bottom: 20px; }
                  .order-info { margin-bottom: 20px; }
                  .payment-info { margin-bottom: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
                  table { width: 100%; border-collapse: collapse; }
                  th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                  .total-section { margin-top: 20px; text-align: right; }
                </style>
              </head>
              <body>
                <div class="print-header">
                  <h1>CycleShop</h1>
                  <h2>Order #${order.orderNumber}</h2>
                </div>
                <div class="order-info">
                  <p><strong>Date:</strong> ${new Date(order.orderDate || new Date()).toLocaleDateString()}</p>
                  <p><strong>Customer:</strong> ${order.customer?.firstName} ${order.customer?.lastName}</p>
                  <p><strong>Status:</strong> ${order.status}</p>
                  ${order.shippingAddress ? `
                    <p><strong>Shipping Address:</strong><br/>
                    ${this.formatAddress(order.shippingAddress)}</p>
                  ` : ''}
                </div>
                ${latestPayment ? `
                <div class="payment-info">
                  <h3>Payment Details</h3>
                  <p><strong>Payment Mode:</strong> ${latestPayment.paymentType?.charAt(0).toUpperCase() + latestPayment.paymentType?.slice(1)}</p>
                  <p><strong>Payment Date:</strong> ${new Date(latestPayment.createdAt).toLocaleString()}</p>
                  <p><strong>Payment Status:</strong> ${latestPayment.status?.replace('_', ' ').charAt(0).toUpperCase() + latestPayment.status?.slice(1)}</p>
                  ${latestPayment.razorpayPaymentId ? `<p><strong>Transaction ID:</strong> ${latestPayment.razorpayPaymentId}</p>` : ''}
                  ${latestPayment.stripePaymentId ? `<p><strong>Transaction ID:</strong> ${latestPayment.stripePaymentId}</p>` : ''}
                </div>
                ` : ''}
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.orderItems.map(item => `
                      <tr>
                        <td>${item.cycle?.sku} ${item.cycle?.modelName}</td>
                        <td>${item.quantity}</td>
                        <td>₹${item.priceSnapshot.toFixed(2)}</td>
                        <td>₹${(item.quantity * item.priceSnapshot).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <div class="total-section">
                  <p><strong>Subtotal:</strong> ₹${order.subtotal.toFixed(2)}</p>
                  <p><strong>Tax:</strong> ₹${order.tax.toFixed(2)}</p>
                  <p><strong>Discount:</strong> ₹${order.discount.toFixed(2)}</p>
                  <p><strong>Total:</strong> ₹${order.totalAmount.toFixed(2)}</p>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        });
    }
  }
}
