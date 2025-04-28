import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, Order, LowStockItem } from '../../services/dashboard.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent implements OnInit {
  totalSales: number = 0;
  totalOrders: number = 0;
  inventoryItems: number = 0;
  totalCustomers: number = 0;
  
  recentOrders: Order[] = [];
  lowStockItems: LowStockItem[] = [];
  
  isLoading: boolean = true;
  error: string | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    // Load summary data
    this.dashboardService.getDashboardSummary()
      .pipe(
        catchError(err => {
          console.error('Error loading dashboard summary', err);
          this.error = 'Failed to load dashboard summary data';
          return of({
            totalSales: 0,
            totalOrders: 0,
            inventoryItems: 0,
            totalCustomers: 0
          });
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe(summary => {
        this.totalSales = summary.totalSales;
        this.totalOrders = summary.totalOrders;
        this.inventoryItems = summary.inventoryItems;
        this.totalCustomers = summary.totalCustomers;
      });

    // Load recent orders
    this.dashboardService.getRecentOrders(5)
      .pipe(
        catchError(err => {
          console.error('Error loading recent orders', err);
          return of([]);
        })
      )
      .subscribe(orders => {
        this.recentOrders = orders;
      });

    // Load low stock items
    this.dashboardService.getLowStockItems(5)
      .pipe(
        catchError(err => {
          console.error('Error loading low stock items', err);
          return of([]);
        })
      )
      .subscribe(items => {
        this.lowStockItems = items;
        console.log('Low stock items:', items);
        
      });
  }
}
