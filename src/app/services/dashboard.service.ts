import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, forkJoin, lastValueFrom, map, switchMap } from 'rxjs';
import { InventoryService } from './inventory.service';

export interface DashboardSummary {
  totalSales: number;
  totalOrders: number;
  inventoryItems: number;
  totalCustomers: number;
}

export interface Order {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: string;
}

export interface LowStockItem {
  product: string;
  brand: string;
  category: string;
  stock: number;
  reorderThreshold: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private apiService: ApiService, private inventoryService: InventoryService) { }

  getDashboardSummary(): Observable<DashboardSummary> {
    return forkJoin({
      orders: this.apiService.get<any[]>('Orders'),
      inventory: this.apiService.get<any[]>('Inventory'),
      customers: this.apiService.get<any[]>('Customers')
    }).pipe(
      map(result => {
        const totalSales = result.orders.reduce((sum, order) => 
          sum + order.totalAmount, 0);
        
        return {
          totalSales,
          totalOrders: result.orders.length,
          inventoryItems: result.inventory.length,
          totalCustomers: result.customers.length
        };
      })
    );
  }

  getRecentOrders(limit: number = 5): Observable<Order[]> {
    return this.apiService.get<any[]>('Orders').pipe(
      map(orders => orders
        .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
        .slice(0, limit)
        .map(order => {
          
          const firstItem = order.orderItems && order.orderItems.length > 0 
            ? order.orderItems[0].cycle.modelName
            : { product: { name: 'Unknown' } };

          console.log('firstItem', firstItem);
            
          return {
            id: `#${order.orderNumber || order.orderId.substring(0, 8)}`,
            customer: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Unknown Customer',
            product: firstItem || 'Multiple Items',
            amount: order.totalAmount,
            status: order.status
          };
        })
      )
    );
  }

  getLowStockItems(threshold: number = 0): Observable<LowStockItem[]> {
    return this.apiService.get<any[]>(`Inventory/low-stock?threshold=${threshold}`).pipe(
      switchMap(items => forkJoin(
        items.map(item => 
          this.apiService.get<any>(`Cycles/${item.cycleId}`).pipe(
            map(cycle => ({
              product: cycle?.modelName || 'Unknown Product',
              category: item.cycle?.cycleType?.name || 'Unknown Category',
              brand: item.cycle?.brand?.name || 'Unknown Brand',
              stock: item.stockQuantity,
              reorderThreshold: item.reorderThreshold,
            }))
          )
        )
      ))
    );
  }
}