import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent {
  username: string = '';

  constructor(private authService: AuthService) {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.username = user.username;
    }
  }

  logout() {
    this.authService.logout();
    window.location.reload();
  }
}
