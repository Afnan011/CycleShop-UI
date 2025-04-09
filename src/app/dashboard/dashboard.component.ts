import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  username: string = '';
  role: string = '';

  constructor(private authService: AuthService) {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.username = user.username;
      this.role = user.role;
    }
  }

  logout() {
    this.authService.logout();
    window.location.reload(); 
  }
}
