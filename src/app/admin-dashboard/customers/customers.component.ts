import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { CustomerStateService } from '../../services/customer-state.service';
import { Customer } from '../../services/customer.service';
import { ToastrService } from 'ngx-toastr';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModalComponent,
    ConfirmModalComponent,
    DatePipe
  ],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  searchQuery: string = '';
  showModal: boolean = false;
  showDeleteModal: boolean = false;
  modalTitle: string = '';
  customerForm: FormGroup;
  selectedCustomer: Customer | null = null;
  editMode: boolean = false;
  currentPage: number = 1;
  totalPages: number = 1;
  itemsPerPage: number = 10;
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  showDetailModal = false;
  currentFormPage: number = 0;
  isAdmin: boolean = false;

  constructor(
    private customerState: CustomerStateService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private router: Router,
    private authService: AuthService
  ) {
    this.customerForm = this.createCustomerForm();
    // Check if the current user is an admin
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.isAdmin = currentUser.role === 'admin';
    }
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.customerState.customers$.subscribe((customers: Customer[]) => {
      this.customers = customers;
      this.updatePagination();
    });

    // Add phone number value changes subscription
    this.customerForm.get('phone')?.valueChanges.subscribe(phone => {
      if (phone && phone.length === 10) {
        this.checkExistingCustomer(phone);
      }
    });
  }

  checkExistingCustomer(phone: string) {
    const existingCustomer = this.customers.find(c => c.phone === phone);
    if (existingCustomer) {
      this.editMode = true;
      this.selectedCustomer = existingCustomer;
      this.modalTitle = 'Edit Customer';

      this.customerForm.patchValue({
        firstName: existingCustomer.firstName,
        lastName: existingCustomer.lastName,
        email: existingCustomer.email,
        phone: existingCustomer.phone,
        billingAddress: existingCustomer.billingAddress,
        shippingAddress: existingCustomer.shippingAddress
      });
    } else {
      // Reset form except phone number if no existing customer found
      const currentPhone = this.customerForm.get('phone')?.value;
      this.customerForm.reset();
      this.customerForm.patchValue({ phone: currentPhone });
      this.editMode = false;
      this.selectedCustomer = null;
      this.modalTitle = 'Add New Customer';
    }
  }
  getErrorMessage(controlName: string): string {
    let control = this.customerForm.get(controlName);

    // Handle nested form controls for addresses
    if (controlName.includes('.')) {
      const [group, field] = controlName.split('.');
      control = this.customerForm.get(group)?.get(field) ?? null;
    }

    if (!control) return '';

    if (control.hasError('required')) {
      return 'This field is required';
    }
    else if (controlName === 'email' || controlName.endsWith('.email')) {
      if (control.hasError('email') || control.hasError('pattern')) {
        return 'Please enter a valid email address';
      }
    }
    else if (controlName === 'phone' || controlName.endsWith('.phone')) {
      if (control.hasError('pattern')) {
        return 'Please enter a valid phone number (10 digits)';
      }
    }

    return '';
  }

  createCustomerForm(): FormGroup {
    return this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      billingAddress: this.fb.group({
        streetLine1: ['', Validators.required],
        streetLine2: [''],
        city: ['', Validators.required],
        state: ['', Validators.required],
        postalCode: ['', Validators.required],
        country: ['', Validators.required]
      }),
      shippingAddress: this.fb.group({
        streetLine1: ['', Validators.required],
        streetLine2: [''],
        city: ['', Validators.required],
        state: ['', Validators.required],
        postalCode: ['', Validators.required],
        country: ['', Validators.required]
      })
    });
  }

  loadCustomers() {
    this.customerState.loadCustomers();
  }

  showAddModal() {
    this.editMode = false;
    this.selectedCustomer = null;
    this.modalTitle = 'Add New Customer';
    this.customerForm.reset();
    this.currentFormPage = 0;
    this.showModal = true;
  }

  editCustomer(customer: Customer) {
    this.editMode = true;
    this.selectedCustomer = customer;
    this.modalTitle = 'Edit Customer';
    this.customerForm.patchValue({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      billingAddress: customer.billingAddress,
      shippingAddress: customer.shippingAddress
    });
    this.currentFormPage = 0;
    this.showModal = true;
  }

  deleteCustomer(customer: Customer) {
    this.selectedCustomer = customer;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (this.selectedCustomer) {
      this.customerState.deleteCustomer(this.selectedCustomer.customerId);
      this.showDeleteModal = false;
    }
  }

  submitForm() {
    if (this.customerForm.invalid) return;

    const formData = this.customerForm.value;

    if (this.editMode && this.selectedCustomer) {
      this.customerState.updateCustomer(this.selectedCustomer.customerId, formData);
    } else {
      this.customerState.addCustomer(formData);
    }
    this.closeModal();
  }

  closeModal() {
    this.showModal = false;
    this.customerForm.reset();
    this.currentFormPage = 0;
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
  }

  filteredCustomers() {
    let filtered = [...this.customers];

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.firstName.toLowerCase().includes(query) ||
        customer.lastName.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.includes(query)
      );
    }

    // Apply sorting
    if (this.sortField) {
      filtered.sort((a, b) => {
        const aValue = a[this.sortField as keyof Customer];
        const bValue = b[this.sortField as keyof Customer];

        if (aValue === undefined || bValue === undefined) return 0;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const aLower = aValue.toLowerCase();
          const bLower = bValue.toLowerCase();
          if (aLower < bLower) return this.sortDirection === 'asc' ? -1 : 1;
          if (aLower > bLower) return this.sortDirection === 'asc' ? 1 : -1;
          return 0;
        }

        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Update pagination whenever filters change
    this.updatePagination();

    // Apply pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  updatePagination() {
    let filtered = this.customers;
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.firstName.toLowerCase().includes(query) ||
        customer.lastName.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.includes(query)
      );
    }
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  nextPage() {
    if (this.currentFormPage < 2) {
      if (this.isCurrentPageValid()) {
        this.currentFormPage++;
      }
    } else if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentFormPage > 0) {
      this.currentFormPage--;
    } else if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
  viewCustomer(customer: Customer) {
    this.router.navigate(['/admin/dashboard/customers', customer.customerId]);
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedCustomer = null;
  }

  goToPage(page: number) {
    if (page >= 0 && page <= 2 && this.isPageAccessible(page)) {
      this.currentFormPage = page;
    }
  }

  isCurrentPageValid(): boolean {
    if (this.currentFormPage === 0) {
      return !!this.customerForm.get('firstName')?.valid &&
             !!this.customerForm.get('lastName')?.valid &&
             !!this.customerForm.get('email')?.valid &&
             !!this.customerForm.get('phone')?.valid;
    } else if (this.currentFormPage === 1) {
      return !!this.customerForm.get('billingAddress')?.valid;
    } else {
      return !!this.customerForm.get('shippingAddress')?.valid;
    }
  }

  isPageAccessible(page: number): boolean {
    if (page === 0) return true;
    if (page === 1) return !!this.customerForm.get('firstName')?.valid &&
                           !!this.customerForm.get('lastName')?.valid &&
                           !!this.customerForm.get('email')?.valid &&
                           !!this.customerForm.get('phone')?.valid;
    if (page === 2) return !!this.customerForm.get('billingAddress')?.valid;
    return false;
  }
}
