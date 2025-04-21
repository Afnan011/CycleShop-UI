import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { CustomerService } from '../../../services/customer.service';

@Component({
  selector: 'app-customer-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-details.component.html',
  styleUrl: './customer-details.component.scss'
})
export class CustomerDetailsComponent implements OnInit {
  customer: any;
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCustomerDetails(id);
    } else {
      this.error = true;
      this.loading = false;
    }
  }
  loadCustomerDetails(id: string): void {
      this.customerService.getCustomer(id)
      .subscribe({
        next: (data: any) => {
          this.customer = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading customer details:', error);
          this.error = true;
          this.loading = false;
          this.router.navigate(['/admin/dashboard/customers']);
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard/customers']);
  }

}
