import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

interface Order {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: string;
}

interface LowStockItem {
  product: string;
  category: string;
  stock: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  username: string = '';
  totalSales: number = 24500;
  totalOrders: number = 156;
  inventoryItems: number = 89;
  totalCustomers: number = 2450;

  recentOrders: Order[] = [
    { id: '#ORD-001', customer: 'John Doe', product: 'Mountain Bike X3', amount: 899, status: 'Delivered' },
    { id: '#ORD-002', customer: 'Jane Smith', product: 'Road Bike Pro', amount: 1299, status: 'Processing' }
  ];

  lowStockItems: LowStockItem[] = [
    { product: 'Mountain Bike X3', category: 'Mountain Bikes', stock: 2 },
    { product: 'Bike Helmet Pro', category: 'Accessories', stock: 5 }
  ];

  constructor(private authService: AuthService) {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.username = user.username;
    }
  }

  ngOnInit() {
    // Here we would typically fetch real data from a service
    this.loadDashboardData();
  }

  loadDashboardData() {
    // TODO: Implement API calls to fetch real data
    // this.dashboardService.getTotalSales().subscribe(sales => this.totalSales = sales);
    // this.dashboardService.getTotalOrders().subscribe(orders => this.totalOrders = orders);
    // etc.
  }

  logout() {
    this.authService.logout();
    window.location.reload();
  }
}
