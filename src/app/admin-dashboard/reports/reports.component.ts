import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { OrderService } from '../../services/order.service';
import { InventoryService } from '../../services/inventory.service';
import { CustomerService } from '../../services/customer.service';
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
  ChartEvent,
  ChartOptions,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  PieController,
  ArcElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from 'chart.js';
import { catchError, forkJoin, of } from 'rxjs';
import { default as Annotation } from 'chartjs-plugin-annotation';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register required Chart.js components explicitly
Chart.register(
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  PieController,
  ArcElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Annotation,
  ChartDataLabels
);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BaseChartDirective],
  providers: [
    provideCharts({
      defaults: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          customCanvasBackgroundColor: {
            beforeDraw: (chart: { width?: any; height?: any; ctx?: any; }) => {
              const { ctx } = chart;
              ctx.save();
              ctx.globalCompositeOperation = 'destination-over';
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, chart.width, chart.height);
              ctx.restore();
            }
          }
        }
      }
    })
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit, AfterViewInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  // Loading and error states
  isLoading = true;
  error: string | null = null;

  // Time period filters
  timePeriods = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' },
    { label: 'All Time', value: 'all' },
    { label: 'Custom', value: 'custom' }
  ];
  selectedPeriod: string = 'month'; // Default to month view
  showCustomDateFilter: boolean = false;

  // Date filters
  startDate: string = this.getDefaultStartDate();
  endDate: string = this.getDefaultEndDate();

  // Raw data storage
  private allOrdersData: any[] = [];
  private allInventoryData: any[] = [];
  private allCustomersData: any[] = [];

  // Sales data
  totalSales: number = 0;
  dailySalesData: any[] = [];
  monthlySalesData: any[] = [];

  // Pagination for dailySalesData
  currentPage: number = 1;
  pageSize: number = 5;

  // Inventory data
  inventoryByCategory: any[] = [];
  lowStockItems: any[] = [];

  // Customer data
  newCustomersCount: number = 0;
  customersByLocation: any[] = [];

  // Order data
  ordersByStatus: any[] = [];

  // Color palettes for charts
  doughnutColors = [
    'rgba(52, 191, 163, 0.7)',
    'rgba(247, 178, 58, 0.7)',
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 99, 132, 0.7)',
    'rgba(153, 102, 255, 0.7)'
  ];

  pieColors = [
    'rgba(255, 99, 132, 0.7)',
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)'
  ];

  // Chart configurations
  public salesChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Daily Sales',
        backgroundColor: 'rgba(48, 132, 227, 0.5)',
        borderColor: 'rgba(48, 132, 227, 1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  public salesChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Daily Sales'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  public salesChartType: ChartType = 'line';

  public orderStatusChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: this.doughnutColors,
        hoverBackgroundColor: this.doughnutColors.map(color => color.replace('0.7', '1'))
      }
    ]
  };

  public orderStatusChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Orders by Status'
      },
      legend: {
        position: 'right'
      }
    }
  };

  public orderStatusChartType: ChartType = 'doughnut';

  public categoryPieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: this.pieColors
      }
    ]
  };

  public categoryPieChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Inventory by Category'
      },
      legend: {
        position: 'right'
      }
    }
  };

  public categoryPieChartType: ChartType = 'pie';

  constructor(
    private dashboardService: DashboardService,
    private orderService: OrderService,
    private inventoryService: InventoryService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    // Default to showing the current month stats
    this.selectTimePeriod('month');
  }

  ngAfterViewInit(): void {
    // Delay re-rendering of charts to ensure containers are properly sized
    setTimeout(() => {
      if (this.chart) {
        this.chart.update();
      }
    }, 300);
  }

  // Helper method to get the background color for chart legends
  getBackgroundColor(index: number, chartType: string): string {
    if (chartType === 'doughnut') {
      return this.doughnutColors[index % this.doughnutColors.length];
    } else if (chartType === 'pie') {
      return this.pieColors[index % this.pieColors.length];
    }
    return '';
  }

  getDefaultStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  }

  getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadReportData(): void {
    this.isLoading = true;
    this.error = null;

    // Use forkJoin to make multiple API calls in parallel
    forkJoin({
      orders: this.orderService.getAllOrders(),
      inventory: this.inventoryService.getCyclesWithInventory(),
      customers: this.customerService.getCustomers()
    }).pipe(
      catchError(err => {
        console.error('Error loading report data', err);
        this.error = 'Failed to load report data. Please try again.';
        return of({ orders: [], inventory: [], customers: [] });
      })
    ).subscribe(data => {
      // Store the raw data
      this.allOrdersData = data.orders;
      this.allInventoryData = data.inventory;
      this.allCustomersData = data.customers;

      // Process data based on selected time period
      this.applyDateFilter();
      
      this.isLoading = false;

      // Update charts after data is loaded
      setTimeout(() => {
        if (this.chart) {
          this.chart.update();
        }
      }, 100);
    });
  }

  selectTimePeriod(period: string): void {
    this.selectedPeriod = period;
    this.showCustomDateFilter = (period === 'custom');
    
    // Calculate date range based on selected period
    if (period !== 'custom') {
      const today = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'today':
          // Just today
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          break;
        case 'week':
          // Start of the current week (Sunday)
          const dayOfWeek = today.getDay();
          startDate = new Date(today);
          startDate.setDate(today.getDate() - dayOfWeek);
          break;
        case 'month':
          // Start of the current month
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case 'year':
          // Start of the current year
          startDate = new Date(today.getFullYear(), 0, 1);
          break;
        case 'all':
          // Find the first order date if any orders exist
          if (this.allOrdersData && this.allOrdersData.length > 0) {
            // Find the earliest order date
            startDate = this.allOrdersData.reduce((earliest, order) => {
              const orderDate = new Date(order.orderDate);
              return orderDate < earliest ? orderDate : earliest;
            }, new Date());
            
            // Set to the first day of that month for clean monthly grouping
            startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
          } else {
            // Default to one year ago if no orders exist
            startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
          }
          break;
      }
      
      this.startDate = this.formatDate(startDate);
      this.endDate = this.formatDate(today);
    }
    
    // If we already have data loaded, just reapply the filter
    if (this.allOrdersData.length > 0) {
      this.applyDateFilter();
    } else {
      this.loadReportData();
    }
  }
  
  applyDateFilter(): void {
    const startDateObj = new Date(this.startDate);
    const endDateObj = new Date(this.endDate);
    
    // Set end date to end of the day to include the whole day
    endDateObj.setHours(23, 59, 59, 999);
    
    // Process data based on date range
    this.processOrdersData(this.allOrdersData, startDateObj, endDateObj);
    this.processInventoryData(this.allInventoryData);
    this.processCustomerData(this.allCustomersData, startDateObj, endDateObj);
    
    // Force chart update after data changes
    setTimeout(() => {
      if (this.chart) {
        this.chart.update();
      }
      
      // Find all chart instances and trigger updates
      const chartInstances = document.querySelectorAll('canvas[baseChart]');
      chartInstances.forEach(chartElement => {
        const chartInstance = Chart.getChart(chartElement.id);
        if (chartInstance) {
          chartInstance.update();
        }
      });
    }, 100);
  }
  
  onDateFilterChange(): void {
    if (this.allOrdersData.length > 0) {
      this.applyDateFilter();
    } else {
      this.loadReportData();
    }
  }

  processOrdersData(orders: any[], startDate: Date, endDate: Date): void {
    // Filter orders by date range
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= startDate && orderDate <= endDate;
    });

    // Calculate total sales
    this.totalSales = filteredOrders.reduce((sum, order) =>
      sum + (order.totalAmount || 0), 0);

    // Group orders by status
    const statusCounts: Record<string, number> = {};
    filteredOrders.forEach(order => {
      const status = order.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Prepare data for order status chart
    this.orderStatusChartData.labels = Object.keys(statusCounts).map(
      status => status.charAt(0).toUpperCase() + status.slice(1)
    );
    this.orderStatusChartData.datasets[0].data = Object.values(statusCounts);

    // Determine the appropriate aggregation level based on the selected time period
    if (this.selectedPeriod === 'year' || this.selectedPeriod === 'all') {
      // Aggregate by month for year and all-time views
      this.aggregateSalesByMonth(filteredOrders, startDate, endDate);
    } else {
      // Use daily aggregation for today, week, and month views
      this.aggregateSalesByDay(filteredOrders, startDate, endDate);
    }

    // Reset to first page when data changes
    this.currentPage = 1;
  }

  aggregateSalesByDay(orders: any[], startDate: Date, endDate: Date): void {
    // Prepare daily sales data
    const dailySales: Record<string, number> = {};
    const dateRange = this.getDatesInRange(startDate, endDate);

    // Initialize all days with zero
    dateRange.forEach(date => {
      dailySales[this.formatDate(date)] = 0;
    });

    // Populate with actual data
    orders.forEach(order => {
      const date = this.formatDate(new Date(order.orderDate));
      dailySales[date] = (dailySales[date] || 0) + (order.totalAmount || 0);
    });

    // Prepare chart data
    this.salesChartData.labels = Object.keys(dailySales);
    this.salesChartData.datasets[0].data = Object.values(dailySales);
    this.salesChartData.datasets[0].label = 'Daily Sales';

    // Store data for table - convert to array and sort by date descending
    this.dailySalesData = Object.entries(dailySales)
      .map(([date, amount]) => ({
        date,
        amount
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  aggregateSalesByMonth(orders: any[], startDate: Date, endDate: Date): void {
    // Prepare monthly sales data
    const monthlySales: Record<string, number> = {};
    
    // Get all months in the range
    const months = this.getMonthsInRange(startDate, endDate);
    
    // Initialize all months with zero
    months.forEach(date => {
      const monthKey = this.formatMonth(date);
      monthlySales[monthKey] = 0;
    });

    // Populate with actual data
    orders.forEach(order => {
      const orderDate = new Date(order.orderDate);
      const monthKey = this.formatMonth(orderDate);
      monthlySales[monthKey] = (monthlySales[monthKey] || 0) + (order.totalAmount || 0);
    });

    // Prepare chart data
    this.salesChartData.labels = Object.keys(monthlySales);
    this.salesChartData.datasets[0].data = Object.values(monthlySales);
    this.salesChartData.datasets[0].label = 'Monthly Sales';

    // Convert to array format for the data table
    this.dailySalesData = Object.entries(monthlySales)
      .map(([month, amount]) => ({
        date: month,
        amount
      }))
      .sort((a, b) => {
        // Sort by date, assuming format is "MMM YYYY"
        const [aMonth, aYear] = a.date.split(' ');
        const [bMonth, bYear] = b.date.split(' ');
        
        if (aYear !== bYear) {
          return parseInt(bYear) - parseInt(aYear);
        }
        
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthOrder.indexOf(bMonth) - monthOrder.indexOf(aMonth);
      });
  }

  formatMonth(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  getMonthsInRange(startDate: Date, endDate: Date): Date[] {
    const months: Date[] = [];
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const lastDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (currentDate <= lastDate) {
      months.push(new Date(currentDate));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return months;
  }

  printReport(): void {
    window.print();
  }

  // Pagination methods
  getPaginatedSalesData(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.dailySalesData.slice(startIndex, startIndex + this.pageSize);
  }

  getTotalPages(): number {
    return Math.ceil(this.dailySalesData.length / this.pageSize);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  processInventoryData(inventory: any[]): void {
    // Group by category (cycle type)
    const categoryCount: Record<string, number> = {};
    inventory.forEach(item => {
      const category = item.type || 'Unknown';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    // Prepare chart data
    this.categoryPieChartData.labels = Object.keys(categoryCount);
    this.categoryPieChartData.datasets[0].data = Object.values(categoryCount);

    // Get low stock items
    this.lowStockItems = inventory.filter(item =>
      item.stockQuantity <= item.reorderThreshold
    ).map(item => ({
      model: item.model,
      brand: item.brand,
      type: item.type,
      stock: item.stockQuantity,
      threshold: item.reorderThreshold,
      status: item.stockQuantity === 0 ? 'Out of Stock' : 'Low Stock'
    }));
  }

  processCustomerData(customers: any[], startDate: Date, endDate: Date): void {
    // Count new customers in date range
    this.newCustomersCount = customers.filter(customer => {
      const createdDate = new Date(customer.createdAt);
      return createdDate >= startDate && createdDate <= endDate;
    }).length;

    // Group customers by location
    const locationCount: Record<string, number> = {};
    customers.forEach(customer => {
      if (customer.billingAddress && customer.billingAddress.city) {
        const city = customer.billingAddress.city;
        locationCount[city] = (locationCount[city] || 0) + 1;
      }
    });

    // Store data for table
    this.customersByLocation = Object.entries(locationCount).map(([location, count]) => ({
      location,
      count
    })).sort((a, b) => b.count - a.count);
  }

  formatDate(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }

  getDatesInRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }
}
