import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ConfirmModalComponent } from '../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ConfirmModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  username: string = '';
  role: string = '';
  showLogoutModal: boolean = false;

  constructor(private authService: AuthService) {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.username = user.username;
      this.role = user.role;
    }
  }

  logout() {
    this.showLogoutModal = true;
  }

  confirmLogout() {
    this.authService.logout();
    window.location.reload();
  }
}
