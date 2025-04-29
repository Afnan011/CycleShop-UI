import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, Order, LowStockItem } from '../../services/dashboard.service';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import {
  BaseChartDirective,
  provideCharts,
  NgChartsConfiguration
} from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartType,
  ChartOptions
} from 'chart.js';
import { default as Annotation } from 'chartjs-plugin-annotation';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register required Chart.js components
Chart.register(Annotation, ChartDataLabels);

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  providers: [
    provideCharts({
      defaults: {
        responsive: true
      }
    })
  ],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent implements OnInit, AfterViewInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  
  totalSales: number = 0;
  totalOrders: number = 0;
  inventoryItems: number = 0;
  totalCustomers: number = 0;
  
  recentOrders: Order[] = [];
  lowStockItems: LowStockItem[] = [];
  
  isLoading: boolean = true;
  error: string | null = null;

  // Colors for charts
  chartColors: string[] = [
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 99, 132, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)'
  ];

  // Sales trend chart
  public salesChartData: ChartData<'line'> = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0],
        label: 'Monthly Sales',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  public salesChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value;
          }
        }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Sales Trend'
      },
      legend: {
        display: false
      }
    }
  };

  public salesChartType: ChartType = 'line';

  // Order status chart
  public orderStatusChartData: ChartData<'doughnut'> = {
    labels: ['Delivered', 'Processing', 'Pending', 'Cancelled'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ]
      }
    ]
  };

  public orderStatusChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12
        }
      },
      title: {
        display: true,
        text: 'Order Status Distribution'
      }
    }
  };

  public orderStatusChartType: ChartType = 'doughnut';

  // Category distribution chart
  public categoryChartData: ChartData<'pie'> = {
    labels: ['Mountain', 'Road', 'City', 'BMX', 'Kids'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0],
        backgroundColor: this.chartColors
      }
    ]
  };

  public categoryChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12
        }
      },
      title: {
        display: true,
        text: 'Cycles by Category'
      }
    }
  };

  public categoryChartType: ChartType = 'pie';

  constructor(private dashboardService: DashboardService, private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // No need for the initial updateCharts here - 
    // we'll update when the data is actually available
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    // Use forkJoin to load all data in parallel
    forkJoin({
      summary: this.dashboardService.getDashboardSummary().pipe(
        catchError(err => {
          console.error('Error loading dashboard summary', err);
          this.error = 'Failed to load dashboard summary data';
          return of({
            totalSales: 0,
            totalOrders: 0,
            inventoryItems: 0,
            totalCustomers: 0
          });
        })
      ),
      orders: this.apiService.get<any[]>('Orders').pipe(
        catchError(err => {
          console.error('Error loading orders', err);
          return of([]);
        })
      ),
      recentOrders: this.dashboardService.getRecentOrders(5).pipe(
        catchError(err => {
          console.error('Error loading recent orders', err);
          return of([]);
        })
      ),
      cycles: this.apiService.get<any[]>('Cycles').pipe(
        catchError(err => {
          console.error('Error loading cycles', err);
          return of([]);
        })
      ),
      lowStockItems: this.dashboardService.getLowStockItems(5).pipe(
        catchError(err => {
          console.error('Error loading low stock items', err);
          return of([]);
        })
      )
    }).pipe(
      finalize(() => {
        this.isLoading = false;
        // Force change detection and chart updates
        setTimeout(() => {
          this.cdr.detectChanges();
          this.forceChartRendering();
        }, 100);
      })
    ).subscribe(results => {
      // Process summary data
      this.totalSales = results.summary.totalSales;
      this.totalOrders = results.summary.totalOrders;
      this.inventoryItems = results.summary.inventoryItems;
      this.totalCustomers = results.summary.totalCustomers;
      
      // Process recent orders
      this.recentOrders = results.recentOrders;
      
      // Process low stock items
      this.lowStockItems = results.lowStockItems;
      
      // Process orders for status chart
      this.processOrderStatusData(results.orders);
      
      // Process cycles for category chart
      this.processCycleCategories(results.cycles);
      
      // Process sales data
      this.processSalesData(results.orders);
    });
  }

  forceChartRendering(): void {
    // Force all charts to render properly
    setTimeout(() => {
      // Find all chart canvases and destroy any existing instances first
      document.querySelectorAll('canvas[baseChart]').forEach(chartElement => {
        const chartId = chartElement.getAttribute('id');
        const chartInstance = Chart.getChart(chartElement as HTMLCanvasElement);
        
        if (chartInstance) {
          console.log(`Forcing update for chart: ${chartId}`);
          chartInstance.update('none'); // Use 'none' for immediate update
        } else {
          console.log(`No chart instance found for: ${chartId}`);
        }
      });
      
      // Force another change detection cycle
      this.cdr.detectChanges();
    }, 300);
  }

  processOrderStatusData(orders: any[]): void {
    // Calculate status counts
    const statusCounts: Record<string, number> = {};
    
    // Count orders by status
    orders.forEach(order => {
      const status = order.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // Map to chart data
    const labels = Object.keys(statusCounts).map(status => 
      status.charAt(0).toUpperCase() + status.slice(1)
    );
    
    const data = Object.values(statusCounts);
    
    // Define colors based on status names
    const colors = labels.map(label => {
      switch(label.toLowerCase()) {
        case 'completed':
        case 'delivered': 
          return 'rgba(75, 192, 192, 0.7)'; // green
        case 'processing': 
          return 'rgba(255, 206, 86, 0.7)'; // yellow
        case 'pending': 
          return 'rgba(255, 159, 64, 0.7)'; // orange
        case 'cancelled': 
          return 'rgba(255, 99, 132, 0.7)'; // red
        default: 
          return 'rgba(153, 102, 255, 0.7)'; // purple
      }
    });
    
    // Update chart data
    this.orderStatusChartData.labels = labels;
    this.orderStatusChartData.datasets[0].data = data;
    this.orderStatusChartData.datasets[0].backgroundColor = colors;
  }

  processCycleCategories(cycles: any[]): void {
    // Group cycles by category
    const categoryCount: Record<string, number> = {};
    
    cycles.forEach(cycle => {
      const category = cycle.cycleType?.name || 'Unknown';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    // Convert to chart data
    const labels = Object.keys(categoryCount);
    const data = Object.values(categoryCount);
    
    // Update chart
    this.categoryChartData.labels = labels;
    this.categoryChartData.datasets[0].data = data;
  }

  processSalesData(orders: any[]): void {
    // Group sales by month for the last 6 months
    const monthlySales: Record<string, number> = {};
    
    // Create an array of the last 6 months
    const months = this.getLastSixMonths();
    const monthLabels = months.map(date => this.formatMonth(date));
    
    // Initialize with zero values
    monthLabels.forEach(month => {
      monthlySales[month] = 0;
    });
    
    // Aggregate sales data by month
    orders.forEach(order => {
      const orderDate = new Date(order.orderDate);
      const monthKey = this.formatMonth(orderDate);
      
      // Only include if it's within the last 6 months
      if (monthLabels.includes(monthKey)) {
        monthlySales[monthKey] = (monthlySales[monthKey] || 0) + (order.totalAmount || 0);
      }
    });
    
    // Update chart with actual data
    this.salesChartData.labels = monthLabels;
    this.salesChartData.datasets[0].data = monthLabels.map(month => monthlySales[month]);
  }
  
  getLastSixMonths(): Date[] {
    const today = new Date();
    const months: Date[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(date);
    }
    
    return months;
  }
  
  formatMonth(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()];
  }
}
