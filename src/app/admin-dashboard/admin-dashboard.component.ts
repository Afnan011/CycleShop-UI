import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ConfirmModalComponent } from '../shared/components/confirm-modal/confirm-modal.component';
import { OrderService, statusType } from '../services/order.service';
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmModalComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  username: string = '';
  userEmail: string = '';
  showLogoutModal: boolean = false;
  sidebarCollapsed: boolean = false;
  showUserMenu: boolean = false;
  processingOrderCount: number = 0;
  lowStockCount: number = 0;
  currentUser: any = null;
  
  constructor(
    private authService: AuthService, 
    private orderService: OrderService, 
    private dashboardService: DashboardService,
    private router: Router) {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.username = user.username;
      }
    }
    
    ngOnInit(): void {
      this.fetchProcessingOrderCount();
      this.fetchLowStockCount();
      this.getUserDetails();
    }
    
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
    
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu;
    }
    
    logout() {
      this.showLogoutModal = true;
    }
    
    fetchLowStockCount() {
      this.dashboardService.getLowStockItems().subscribe({
        next: (lowStockItems) => {
          this.lowStockCount = lowStockItems.length;       
        },
        error: (error) => {
          console.error('Error fetching low stock items:', error);
          this.lowStockCount = 0;
        }
      });
    }
    
    fetchProcessingOrderCount() {
      this.orderService.getAllOrders().subscribe({
        next: (orders) => {
          const processing: statusType = 'processing';
          const processingOrders = orders.filter(order => order.status === processing);
        
          this.processingOrderCount = processingOrders.length;
        },
        error: (error) => {
          console.error('Error fetching orders:', error);
          this.processingOrderCount = 0;
        }
      });
    }
    
    getUserDetails() {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.dashboardService.getUserDetails(user.username).subscribe({
          next: (userDetails) => {
            this.currentUser = userDetails;
          },
          error: (error) => {
            console.error('Error fetching user details:', error);
          }
        });
      }
      
      
    }
    
  viewProfile() {
    this.router.navigate(
      ['/admin/dashboard/employees/' + this.currentUser.id], 
      { queryParams: { from: 'dashboard' } }
    );
    this.showUserMenu = false;
  }
  
  viewSettings() {
    this.router.navigate(['/admin/dashboard/settings']);
    this.showUserMenu = false;
  }
  
  confirmLogout() {
    this.authService.logout();
    window.location.reload();
  }
}
