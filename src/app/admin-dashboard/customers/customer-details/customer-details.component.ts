import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { CustomerService } from '../../../services/customer.service';
import { OrderService, Order } from '../../../services/order.service';

@Component({
  selector: 'app-customer-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-details.component.html',
  styleUrl: './customer-details.component.scss'
})
export class CustomerDetailsComponent implements OnInit {
  customer: any;
  loading = true;
  error = false;
  orders: Order[] = [];
  loadingOrders = true;
  ordersError = false;
  
  // Pagination properties
  currentPage = 1;
  pageSize = 5;
  totalOrders = 0;
  paginatedOrders: Order[] = [];

  // Modal properties
  showOrderDetailsModal = false;
  selectedOrder: Order | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCustomerDetails(id);
    } else {
      this.error = true;
      this.loading = false;
    }
  }

  loadCustomerDetails(id: string): void {
    this.customerService.getCustomer(id)
      .subscribe({
        next: (data: any) => {
          this.customer = data;
          this.loading = false;
          this.loadCustomerOrders(id);
        },
        error: (error) => {
          console.error('Error loading customer details:', error);
          this.error = true;
          this.loading = false;
          this.router.navigate(['/admin/dashboard/customers']);
        }
      });
  }

  loadCustomerOrders(customerId: string): void {
    this.loadingOrders = true;
    this.orderService.getOrdersByCustomer(customerId)
      .subscribe({
        next: (orders: Order[]) => {
          this.orders = orders;
          this.totalOrders = orders.length;
          this.updatePaginatedOrders();
          this.loadingOrders = false;
        },
        error: (error) => {
          console.error('Error loading customer orders:', error);
          this.ordersError = true;
          this.loadingOrders = false;
        }
      });
  }

  updatePaginatedOrders(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedOrders = this.orders.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.updatePaginatedOrders();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalOrders / this.pageSize);
  }

  getPageRange(): number[] {
    const totalPages = this.getTotalPages();
    const range: number[] = [];
    
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }
    
    return range;
  }

  getOrderStatusClass(status: string | undefined): string {
    if (!status) return '';
    switch(status.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'processing': return 'status-processing';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR'
    }).format(amount);
  }

  viewOrderDetails(orderId: string): void {
    // Find the order in our existing orders array
    const order = this.orders.find(o => o.orderId === orderId);
    if (order) {
      this.selectedOrder = order;
      this.showOrderDetailsModal = true;
    }
  }

  closeOrderDetailsModal(): void {
    this.showOrderDetailsModal = false;
    this.selectedOrder = null;
  }

  printOrder(): void {
    if (this.selectedOrder) {
      this.orderService.printOrder(this.selectedOrder);
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard/customers']);
  }
}
