import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { authGuard } from './guards/auth.guard';
import { InventoryComponent } from './admin-dashboard/inventory/inventory.component';
import { DashboardHomeComponent } from './admin-dashboard/dashboard-home/dashboard-home.component';
import { CycleDetailsComponent } from './admin-dashboard/inventory/cycle-details/cycle-details.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
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
    data: { requiresAdmin: true },
    children: [
      {
        path: '',
        component: DashboardHomeComponent
      },
      {
        path: 'inventory',
        component: InventoryComponent
      },
      {
        path: 'inventory/:id',
        component: CycleDetailsComponent
      }
    ]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
