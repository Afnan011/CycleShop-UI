import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Customer } from './customer.service';
import { CustomerService } from './customer.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class CustomerStateService {
  private customersSubject = new BehaviorSubject<Customer[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string>('');

  customers$ = this.customersSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(
    private customerService: CustomerService,
    private toastr: ToastrService
  ) {}

  loadCustomers() {
    this.loadingSubject.next(true);
    this.errorSubject.next('');

    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customersSubject.next(customers);
        this.loadingSubject.next(false);
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        this.errorSubject.next('Failed to load customers');
        this.loadingSubject.next(false);
        this.toastr.error('Failed to load customers');
      }
    });
  }

  addCustomer(customerData: any) {
    this.loadingSubject.next(true);
    this.customerService.createCustomer(customerData).subscribe({
      next: () => {
        this.loadCustomers();
        this.toastr.success('Customer added successfully');
      },
      error: (err) => {
        console.error('Error adding customer:', err);
        this.errorSubject.next('Failed to add customer');
        this.loadingSubject.next(false);
        this.toastr.error('Failed to add customer');
      }
    });
  }

  updateCustomer(customerId: string, customerData: any) {
    this.loadingSubject.next(true);
    this.customerService.updateCustomer(customerId, customerData).subscribe({
      next: () => {
        this.loadCustomers();
        this.toastr.success('Customer updated successfully');
      },
      error: (err) => {
        console.error('Error updating customer:', err);
        this.errorSubject.next('Failed to update customer');
        this.loadingSubject.next(false);
        this.toastr.error('Failed to update customer');
      }
    });
  }

  deleteCustomer(customerId: string) {
    this.loadingSubject.next(true);
    this.customerService.deleteCustomer(customerId).subscribe({
      next: () => {
        this.loadCustomers();
        this.toastr.success('Customer deleted successfully');
      },
      error: (err) => {
        console.error('Error deleting customer:', err);
        this.errorSubject.next('Failed to delete customer');
        this.loadingSubject.next(false);
        this.toastr.error('Failed to delete customer');
      }
    });
  }

  updateLoyaltyPoints(customerId: string, points: number) {
    this.loadingSubject.next(true);
    this.customerService.updateLoyaltyPoints(customerId, points).subscribe({
      next: () => {
        this.loadCustomers();
        this.toastr.success('Loyalty points updated successfully');
      },
      error: (err) => {
        console.error('Error updating loyalty points:', err);
        this.errorSubject.next('Failed to update loyalty points');
        this.loadingSubject.next(false);
        this.toastr.error('Failed to update loyalty points');
      }
    });
  }
}
