import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { OrderService, Order, Customer, Address, Cycle, CreateOrderRequest, Inventory, statusType } from '../../services/order.service';
import { CustomerService } from 'src/app/services/customer.service';
import { OrderDetailsModalComponent } from "./order-details-modal/order-details-modal.component";

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule, OrderDetailsModalComponent],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit {
  // Search & Filter properties
  searchQuery: string = '';
  statusFilter: string = 'all';
  startDate: string = '';
  endDate: string = '';

  // Sorting properties
  sortField: string = 'orderDate';
  sortDirection: string = 'desc';

  // Pagination properties
  pageSize: number = 5;
  currentPage: number = 1;
  totalItems: number = 0;
  pageSizeOptions: number[] = [5, 10, 15, 25, 50];

  // Data collections
  orders: Order[] = [];
  customers: Customer[] = [];
  customerAddresses: Address[] = [];
  availableCycles: Cycle[] = [];

  // Modal control properties
  showCreateModal: boolean = false;
  showDetailsModal: boolean = false;
  selectedOrder: Order | null = null;
  isEditingStatus: boolean = false;
  newStatus: string | statusType = '';

  // Form properties
  orderForm: FormGroup;

  constructor(
    private orderService: OrderService,
    private customerService: CustomerService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.orderForm = this.fb.group({
      customerId: ['', Validators.required],
      shippingAddressId: [''],
      discount: [0, [Validators.min(0), Validators.max(99999999)]],
      notes: [''],
      orderItems: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadOrders();
    this.loadCustomers();
    this.loadCycles();
    
    // Check if we're coming from POS with cart data
    const navigation = window.history.state;
    if (navigation && navigation.createOrder && navigation.cartItems) {
      // Wait for data to load first
      setTimeout(() => {
        this.prepareOrderFromPOS(navigation.cartItems);
      }, 500);
    }
  }

  // New method to handle data from POS
  prepareOrderFromPOS(cartItems: any[]): void {
    this.resetOrderForm();
    
    // Add cart items to order form
    if (cartItems && cartItems.length > 0) {
      // Remove the default empty order item
      while (this.orderItemsFormArray.length !== 0) {
        this.orderItemsFormArray.removeAt(0);
      }
      
      // Add each item from POS cart
      cartItems.forEach(item => {
        // Create detailed cycle info
        const cycleDetails = {
          modelName: item.cycle.model,
          sku: item.cycle.sku || 'N/A',
          brandName: item.cycle.brand
        };
        
        const itemGroup = this.fb.group({
          cycleId: [item.cycle.id, Validators.required],
          quantity: [item.quantity, [Validators.required, Validators.min(1)]],
          priceSnapshot: [item.cycle.price, Validators.required],
          taxRate: [0.1],
          maxQuantity: [item.cycle.stockQuantity],
          cycleDetails: this.fb.group({
            modelName: [cycleDetails.modelName],
            sku: [cycleDetails.sku],
            brandName: [cycleDetails.brandName]
          })
        });
        
        this.orderItemsFormArray.push(itemGroup);
        console.log('Added item to order:', item);
      });
      
      // Calculate totals
      this.updateTotals();
      
      // Open the create order modal
      this.showCreateModal = true;
      
      // Show a notification to the user
      this.toastr.info('Items from POS have been added to the order. Please select a customer to continue.');
    }
  }

  // Getters
  get orderItemsFormArray(): FormArray {
    return this.orderForm.get('orderItems') as FormArray;
  }

  // CRUD Operations
  loadOrders(): void {
    this.orderService.getAllOrders().subscribe((orders) => {
      this.orders = orders;
    });
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe((customers) => {
      this.customers = customers;
    });
  }

  loadCycles(): void {
    this.orderService.getAllCycles().subscribe((cycles) => {
      this.availableCycles = cycles;
    });
  }

  loadCustomerAddresses(customerId: string): void {
    this.customerService.getCustomer(customerId).subscribe((customer) => {
      this.customerAddresses = [
        ...(Array.isArray(customer.shippingAddress)
          ? customer.shippingAddress
          : [customer.shippingAddress]),
        ...(Array.isArray(customer.billingAddress)
          ? customer.billingAddress
          : [customer.billingAddress]),
      ].filter((address) => address !== null && address !== undefined);
    });
  }

  // Form Operations
  showCreateOrderModal(): void {
    this.resetOrderForm();
    this.showCreateModal = true;
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showDetailsModal = false;
    this.isEditingStatus = false;
  }

  resetOrderForm(): void {
    this.orderForm.reset({
      customerId: '',
      shippingAddressId: '',
      discount: 0,
      notes: '',
    });

    while (this.orderItemsFormArray.length !== 0) {
      this.orderItemsFormArray.removeAt(0);
    }
    this.addOrderItem();
  }

  addOrderItem(): void {
    // Check if there's an empty first item
    if (this.orderItemsFormArray.length > 0) {
      const lastItem = this.orderItemsFormArray.at(this.orderItemsFormArray.length - 1);
      if (!lastItem.get('cycleId')?.value) {
        this.toastr.warning('Please select a cycle for the current item before adding a new one');
        return;
      }
    }

    const itemGroup = this.fb.group({
      cycleId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      priceSnapshot: [0, Validators.required],
      taxRate: [0.1],
      maxQuantity: [0],
      cycleDetails: this.fb.group({
        modelName: [''],
        sku: [''],
        brandName: ['']
      })
    });

    this.orderItemsFormArray.push(itemGroup);
  }

  removeOrderItem(index: number): void {
    this.orderItemsFormArray.removeAt(index);
  }

  onCycleSelect(index: number): void {
    const itemForm = this.orderItemsFormArray.at(index);
    const cycleId = itemForm.get('cycleId')?.value;

    if (!cycleId) return;

    const selectedCycle = this.availableCycles.find(
      (c) => c.cycleId === cycleId
    );

    if (selectedCycle) {
      // Patch the form with cycle details including brand name
      itemForm.patchValue({
        cycleDetails: {
          modelName: selectedCycle.modelName,
          sku: selectedCycle.sku,
          brandName: selectedCycle.brand?.name || 'Unknown Brand'
        }
      });

      // Find the current inventory for this cycle
      this.orderService.getInventoryForCycle(cycleId).subscribe({
        next: (inventory: Inventory) => {
          const maxStock = inventory.stockQuantity;
          const safeQuantity = Math.min(1, maxStock);

          itemForm.patchValue({
            priceSnapshot: selectedCycle.price,
            maxQuantity: maxStock,
            quantity: safeQuantity
          });

          if (maxStock <= 0) {
            this.toastr.warning('This cycle is out of stock!');
          } else if (maxStock <= inventory.reorderThreshold) {
            this.toastr.info('This cycle is running low on stock');
          }

          // Update form validation
          itemForm.get('quantity')?.setValidators([
            Validators.required,
            Validators.min(1),
            Validators.max(maxStock)
          ]);
          itemForm.get('quantity')?.updateValueAndValidity();

          this.updateItemTotal(index);
        },
        error: (err: Error) => {
          this.toastr.error('Error fetching inventory information');
          console.error('Error fetching inventory:', err);
        }
      });
    }
  }

  calculateItemTotal(index: number): number {
    const itemForm = this.orderItemsFormArray.at(index);
    const price = Number(itemForm.get('priceSnapshot')?.value) || 0;
    const quantity = Number(itemForm.get('quantity')?.value) || 0;
    return price * quantity;
  }

  calculateSubtotal(): number {
    return this.orderItemsFormArray.controls.reduce((total, item) => {
      const price = Number(item.get('priceSnapshot')?.value) || 0;
      const quantity = Number(item.get('quantity')?.value) || 0;
      return total + price * quantity;
    }, 0);
  }

  calculateTax(): number {
    return this.orderItemsFormArray.controls.reduce((total, item) => {
      const price = Number(item.get('priceSnapshot')?.value) || 0;
      const quantity = Number(item.get('quantity')?.value) || 0;
      const taxRate = Number(item.get('taxRate')?.value) || 0;
      return total + price * quantity * taxRate;
    }, 0);
  }

  calculateTotal(): number {
    const subtotal = this.calculateSubtotal();
    const tax = this.calculateTax();
    const discount = Number(this.orderForm.get('discount')?.value) || 0;

    // Validate discount against max allowed (50% of subtotal)
    const maxDiscount = subtotal * 0.5;
    if (discount > maxDiscount) {
      this.toastr.warning('Discount cannot exceed 50% of the subtotal');
      this.orderForm.patchValue({ discount: maxDiscount });
      return subtotal + tax - maxDiscount;
    }

    return subtotal + tax - discount;
  }

  updateItemTotal(index: number): void {
    const itemForm = this.orderItemsFormArray.at(index);
    const price = Number(itemForm.get('priceSnapshot')?.value) || 0;
    const quantity = Number(itemForm.get('quantity')?.value) || 0;
    const maxQuantity = Number(itemForm.get('maxQuantity')?.value) || 0;

    if (isNaN(quantity)) {
      itemForm.patchValue({ quantity: 1 });
      this.toastr.warning('Invalid quantity value, reset to 1');
    } else if (quantity > maxQuantity) {
      itemForm.patchValue({ quantity: maxQuantity });
      this.toastr.warning(`Quantity adjusted to maximum available stock: ${maxQuantity}`);
    }

    this.updateTotals();
  }

  updateTotals(): void {
    const subtotal = this.calculateSubtotal();
    const tax = this.calculateTax();
    const total = this.calculateTotal();
  }

  // Form Submission
  submitOrder(): void {
    if (this.orderForm.invalid) {
      this.toastr.error('Please fill in all required fields');
      return;
    }

    // Check if there are any items in the order
    if (this.orderItemsFormArray.length === 0) {
      this.toastr.error('Please add at least one item to the order');
      return;
    }

    // Check if all items have cycles selected
    const hasEmptyItems = this.orderItemsFormArray.controls.some(item => !item.get('cycleId')?.value);
    if (hasEmptyItems) {
      this.toastr.error('Please select cycles for all order items');
      return;
    }

    const subtotal = this.calculateSubtotal();
    const maxDiscount = subtotal * 0.5;
    const currentDiscount = this.orderForm.get('discount')?.value || 0;

    if (currentDiscount > maxDiscount) {
      this.toastr.error('Discount cannot exceed 50% of the total amount');
      return;
    }

    // Check if any items exceed available stock
    let hasStockIssue = false;
    this.orderItemsFormArray.controls.forEach(item => {
      const quantity = Number(item.get('quantity')?.value) || 0;
      const maxQuantity = Number(item.get('maxQuantity')?.value) || 0;
      if (quantity > maxQuantity) {
        hasStockIssue = true;
        this.toastr.error(`Insufficient stock for selected quantity of item`);
      }
    });

    if (hasStockIssue) return;

    // Get the employee ID from the JWT token
    const storedUser = localStorage.getItem('currentUser');
    let employeeId = '';

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const tokenPayload = JSON.parse(atob(user.token.split('.')[1]));
        employeeId = tokenPayload.nameid || tokenPayload.sub || ''; // JWT commonly uses nameid or sub for user ID

        // If employee ID not found in typical claims, check for custom claims
        if (!employeeId && tokenPayload.userId) {
          employeeId = tokenPayload.userId;
        }
      } catch (error) {
        console.error('Error extracting employee ID from token:', error);
        // Fallback to default ID if there's an error
        employeeId = '00000000-0000-0000-0000-000000000000';
      }
    } else {
      // Fallback if no user found in localStorage
      employeeId = '00000000-0000-0000-0000-000000000000';
    }

    // Prepare order data for payment page
    const orderData = {
      orderInfo: {
        customerId: this.orderForm.get('customerId')?.value,
        shippingAddressId: this.orderForm.get('shippingAddressId')?.value,
        discount: this.orderForm.get('discount')?.value || 0,
        notes: this.orderForm.get('notes')?.value || '',
        employeeId: employeeId,
        customer: this.customers.find(c => c.customerId === this.orderForm.get('customerId')?.value),
      },
      items: this.orderItemsFormArray.controls.map((item) => ({
        cycleId: item.get('cycleId')?.value,
        quantity: item.get('quantity')?.value,
        priceSnapshot: item.get('priceSnapshot')?.value,
        cycleDetails: item.get('cycleDetails')?.value
      })),
      financialDetails: {
        subtotal: this.calculateSubtotal(),
        tax: this.calculateTax(),
        totalAmount: this.calculateTotal(),
      }
    };

    // Navigate to payment page with order data
    this.router.navigate(['/admin/dashboard/payment'], {
      state: { 
        order: orderData,
        isPendingOrder: true
      }
    });
    
    // Close the create order modal
    this.closeModals();
  }

  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;

    this.newStatus = order.status || 'pending';
    this.showDetailsModal = true;
  }

  editOrder(order: Order): void {
    this.viewOrderDetails(order);
  }

  updateOrderStatus(newStatus: any): void {
    if (!this.selectedOrder) return;

    const updateData = {
      status: newStatus,
    };

    this.orderService
      .updateOrderStatus(this.selectedOrder.orderId!, updateData)
      .subscribe({
        next: () => {
          if (this.selectedOrder) {
            this.selectedOrder.status = this.newStatus as statusType;
          }
          this.isEditingStatus = false;
          this.loadOrders();
          this.toastr.success('Order status updated successfully');
          this.closeModals();
        },
        error: (err) => {
          console.error('Error updating order status', err);
        },
      });
  }

  // Helper Functions
  formatAddress(address: Address): string {
    return this.orderService.formatAddress(address);
  }

  printOrder(order: Order): void {
    this.orderService.printOrder(order);
  }

  // Filter & Sort Functions
  filteredOrders(): Order[] {
    const filtered = this.orders
      .filter((order) => {
        // Search query filter
        const searchLower = this.searchQuery.toLowerCase();
        const matchesSearch =
          !this.searchQuery ||
          order.orderNumber?.toLowerCase().includes(searchLower) ||
          order.customer?.firstName?.toLowerCase().includes(searchLower) ||
          order.customer?.lastName?.toLowerCase().includes(searchLower);

        // Status filter
        const matchesStatus =
          this.statusFilter === 'all' || order.status === this.statusFilter;

        // Date filter
        let matchesDate = true;
        if (this.startDate) {
          const startDateObj = new Date(this.startDate);
          matchesDate =
            matchesDate && new Date(order.orderDate || '') >= startDateObj;
        }
        if (this.endDate) {
          const endDateObj = new Date(this.endDate);
          endDateObj.setDate(endDateObj.getDate() + 1); // Include the end date
          matchesDate =
            matchesDate && new Date(order.orderDate || '') < endDateObj;
        }

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        // Dynamic sorting
        let valueA: any;
        let valueB: any;

        switch (this.sortField) {
          case 'orderNumber':
            valueA = a.orderNumber?.toLowerCase() || '';
            valueB = b.orderNumber?.toLowerCase() || '';
            break;
          case 'customer':
            valueA =
              `${a.customer?.lastName} ${a.customer?.firstName}`.toLowerCase();
            valueB =
              `${b.customer?.lastName} ${b.customer?.firstName}`.toLowerCase();
            break;
          case 'orderDate':
            valueA = new Date(a.orderDate || '').getTime();
            valueB = new Date(b.orderDate || '').getTime();
            break;
          case 'status':
            valueA = a.status?.toLowerCase() || '';
            valueB = b.status?.toLowerCase() || '';
            break;
          case 'totalAmount':
            valueA = a.totalAmount;
            valueB = b.totalAmount;
            break;
          default:
            valueA = new Date(a.orderDate || '').getTime();
            valueB = new Date(b.orderDate || '').getTime();
        }

        if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });

    this.totalItems = filtered.length;
    return filtered;
  }

  paginatedOrders(): Order[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders().slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 1; // Reset to first page when changing page size
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();

    if (totalPages <= 7) {
      // If 7 or fewer pages, show all pages
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Complex pagination with ellipsis
    const pages: number[] = [];

    // Always show first page
    pages.push(1);

    // Calculate start and end of the middle section
    let startPage: number, endPage: number;

    if (this.currentPage <= 4) {
      // Current page is near the start
      startPage = 2;
      endPage = 5;
      pages.push(
        ...Array.from(
          { length: endPage - startPage + 1 },
          (_, i) => startPage + i
        )
      );
      pages.push(0); // Representation for ellipsis
    } else if (this.currentPage >= totalPages - 3) {
      // Current page is near the end
      pages.push(0); // Representation for ellipsis
      startPage = totalPages - 4;
      endPage = totalPages - 1;
      pages.push(
        ...Array.from(
          { length: endPage - startPage + 1 },
          (_, i) => startPage + i
        )
      );
    } else {
      // Current page is in the middle
      pages.push(0); // Representation for ellipsis
      startPage = this.currentPage - 1;
      endPage = this.currentPage + 1;
      pages.push(
        ...Array.from(
          { length: endPage - startPage + 1 },
          (_, i) => startPage + i
        )
      );
      pages.push(0); // Representation for ellipsis
    }

    // Always show last page
    pages.push(totalPages);

    return pages;
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      // Toggle direction if same field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new field and default to ascending
      this.sortField = field;
      this.sortDirection = 'asc';
    }
  }

  // Reset pagination when search, filter, or date changes
  onSearchChange(): void {
    this.currentPage = 1; // Reset to first page
  }

  // Handle customer selection to load addresses
  onCustomerSelect(): void {
    const customerId = this.orderForm.get('customerId')?.value;
    if (customerId) {
      this.loadCustomerAddresses(customerId);
    } else {
      this.customerAddresses = [];
    }
    // Reset shipping address when customer changes
    this.orderForm.get('shippingAddressId')?.setValue(null);
  }

  // Handle address selection
  onAddressSelect(): void {
    const shippingAddressId = this.orderForm.get('shippingAddressId')?.value;
    console.log('Selected shipping address:', shippingAddressId);

    // Make sure the form value is updated
    this.orderForm.patchValue({
      shippingAddressId: shippingAddressId
    });
  }

  // Helper method to check if there are any products selected in the order
  hasSelectedProducts(): boolean {
    if (this.orderItemsFormArray.length === 0) {
      return false;
    }
    // Check if at least one order item has a selected cycle
    return this.orderItemsFormArray.controls.some(
      (item) =>
        item.get('cycleId')?.value !== null && item.get('cycleId')?.value !== ''
    );
  }

  onQuantityChange(index: number): void {
    const itemForm = this.orderItemsFormArray.at(index);
    const quantity = Number(itemForm.get('quantity')?.value);
    const maxQuantity = Number(itemForm.get('maxQuantity')?.value) || 0;
    const cycleId = itemForm.get('cycleId')?.value;

    if (!cycleId) return;

    const selectedCycle = this.availableCycles.find(c => c.cycleId === cycleId);
    if (!selectedCycle) return;

    if (isNaN(quantity)) {
      itemForm.patchValue({ quantity: 1 });
      this.toastr.warning('Please enter a valid quantity');
    } else if (quantity > maxQuantity) {
      itemForm.patchValue({ quantity: maxQuantity });
      this.toastr.warning(`Maximum available stock is ${maxQuantity}`);
    } else if (quantity < 1) {
      itemForm.patchValue({ quantity: 1 });
      this.toastr.warning('Minimum quantity is 1');
    }

    this.updateTotals();
  }
}
