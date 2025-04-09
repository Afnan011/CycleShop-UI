import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent {
  totalSales: number = 24500;
  totalOrders: number = 156;
  inventoryItems: number = 89;
  totalCustomers: number = 2450;

  recentOrders: Order[] = [
    { id: '#ORD-001', customer: 'John Doe', product: 'Mountain Bike X3', amount: 899, status: 'Delivered' },
    { id: '#ORD-002', customer: 'Jane Smith', product: 'Road Bike Pro', amount: 1299, status: 'Processing' },
  ];

  lowStockItems: LowStockItem[] = [
    { product: 'Mountain Bike X3', category: 'Mountain Bikes', stock: 2 },
    { product: 'Road Bike Elite', category: 'Road Bikes', stock: 3 },
  ];
}
