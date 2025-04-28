import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../../services/user.service';
import { OrderService, Order } from '../../../services/order.service';
import { ToastrService } from 'ngx-toastr';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';

interface EmployeeStats {
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
  customersServed: number;
}

@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './employee-details.component.html',
  styleUrls: ['./employee-details.component.scss']
})


export class EmployeeDetailsComponent implements OnInit {
  employeeId: string = '';
  employee: User | null = null;
  orders: Order[] = [];
  loading: boolean = true;
  error: string | null = null;
  stats: EmployeeStats = {
    totalOrders: 0,
    totalSales: 0,
    averageOrderValue: 0,
    customersServed: 0
  };
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  
  // Filters
  startDate: string = '';
  endDate: string = '';
  statusFilter: string = 'all';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private orderService: OrderService,
    private toastr: ToastrService
  ) { }
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.employeeId = id;
        this.loadEmployeeDetails();
      } else {
        this.toastr.error('Employee ID not found');
        this.router.navigate(['/admin/dashboard/employees']);
      }
    });
  }

  loadEmployeeDetails(): void {
    this.loading = true;
    this.error = null;

    this.userService.getUser(this.employeeId).pipe(
      switchMap(employee => {
        this.employee = employee;
        // Using the updated method that matches the OrdersController endpoint
        return this.orderService.getOrdersByEmployee(this.employeeId, this.getOrderFilters());
      }),
      catchError(error => {
        this.error = 'Failed to load employee details: ' + (error.message || 'Unknown error');
        this.toastr.error(this.error);
        return of([]);
      })
    ).subscribe(orders => {
      this.orders = orders;
      this.calculateStats();
      this.updatePagination();
      this.loading = false;
    });
  }
  
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/user-avatar.png';
  }

  private getOrderFilters(): any {
    const filters: any = { 
      status: this.statusFilter !== 'all' ? this.statusFilter : undefined
    };
    
    if (this.startDate) {
      filters.startDate = this.startDate;
    }

    if (this.endDate) {
      filters.endDate = this.endDate;
    }

    return filters;
  }

  calculateStats(): void {
    // Calculate total sales and unique customers
    let totalSales = 0;
    const uniqueCustomers = new Set<string>();

    this.orders.forEach(order => {
      totalSales += order.totalAmount;
      if (order.customerId) {
        uniqueCustomers.add(order.customerId);
      }
    });

    this.stats = {
      totalOrders: this.orders.length,
      totalSales: totalSales,
      averageOrderValue: this.orders.length > 0 ? totalSales / this.orders.length : 0,
      customersServed: uniqueCustomers.size
    };
  }

  updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.orders.length / this.pageSize));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  applyFilters(): void {
    this.loadEmployeeDetails();
  }

  resetFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.statusFilter = 'all';
    this.loadEmployeeDetails();
  }

  paginatedOrders(): Order[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.orders.slice(startIndex, startIndex + this.pageSize);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard/employees']);
  }
}