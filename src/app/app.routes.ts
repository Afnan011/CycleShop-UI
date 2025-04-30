import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { authGuard } from './guards/auth.guard';
import { InventoryComponent } from './admin-dashboard/inventory/inventory.component';
import { DashboardHomeComponent } from './admin-dashboard/dashboard-home/dashboard-home.component';
import { CycleDetailsComponent } from './admin-dashboard/inventory/cycle-details/cycle-details.component';
import { PosComponent } from './admin-dashboard/pos/pos.component';
import { OrdersComponent } from './admin-dashboard/orders/orders.component';
import { CustomersComponent } from './admin-dashboard/customers/customers.component';
import { CustomerDetailsComponent } from './admin-dashboard/customers/customer-details/customer-details.component';
import { EmployeesComponent } from './admin-dashboard/employees/employees.component';
import { EmployeeDetailsComponent } from './admin-dashboard/employees/employee-details/employee-details.component';
import { ReportsComponent } from './admin-dashboard/reports/reports.component';
import { SettingsComponent } from './admin-dashboard/settings/settings.component';
import { PaymentComponent } from './admin-dashboard/payment/payment.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: DashboardHomeComponent
      },
      {
        path: 'inventory',
        children: [
          {
            path: '',
            component: InventoryComponent
          },
          {
            path: ':id',
            component: CycleDetailsComponent
          }
        ]
      },
      {
        path: 'pos',
        component: PosComponent
      },
      {
        path: 'payment',
        component: PaymentComponent
      },
      {
        path: 'orders',
        component: OrdersComponent
      },      
      {
        path: 'customers',
        children: [
          {
            path: '',
            component: CustomersComponent
          },
          {
            path: ':id',
            component: CustomerDetailsComponent
          }
        ]
      },
      {
        path: 'employees',
        component: EmployeesComponent,
        data: { requiresAdmin: true }
      },
      {
        path: 'employees/:id',
        component: EmployeeDetailsComponent,
        data: { requiresAdmin: true }
      },
      {
        path: 'reports',
        component: ReportsComponent,
        data: { requiresAdmin: true }
      },
      {
        path: 'settings',
        component: SettingsComponent,
        data: { requiresAdmin: true }
      }
    ]
  },
  {
    path: 'dashboard',
    redirectTo: '/admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/admin/dashboard'
  }
];
