import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { Router } from '@angular/router';

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  expiresIn?: number; // Time in seconds until token expires
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/Users`;
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenExpirationTimer: any;

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (this.isTokenExpired(user.token)) {
        this.logout();
      } else {
        this.currentUserSubject.next(user);
        this.setTokenExpirationTimer(user.token);
      }
    }
  }

  private isTokenExpired(token: string): boolean {
    if (!token) return true;

    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expirationTime;
    } catch (error) {
      return true;
    }
  }

  private setTokenExpirationTimer(token: string) {
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
      const timeUntilExpiry = expirationTime - Date.now();

      // Clear any existing timer
      if (this.tokenExpirationTimer) {
        clearTimeout(this.tokenExpirationTimer);
      }

      // Set new timer
      this.tokenExpirationTimer = setTimeout(() => {
        this.logout();
        this.router.navigate(['/login']);
      }, timeUntilExpiry);
    } catch (error) {
      console.error('Error setting token expiration timer:', error);
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/authenticate`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem('currentUser', JSON.stringify(response));
          this.currentUserSubject.next(response);
          this.setTokenExpirationTimer(response.token);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
  }

  getCurrentUser(): LoginResponse | null {
    const user = this.currentUserSubject.value;
    if (user && this.isTokenExpired(user.token)) {
      this.logout();
      return null;
    }
    return user;
  }

  isLoggedIn(): boolean {
    const user = this.getCurrentUser();
    return !!user && !this.isTokenExpired(user.token);
  }

  getToken(): string | null {
    const currentUser = this.getCurrentUser();
    return currentUser ? currentUser.token : null;
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/forgot-password`, { email });
  }

  getImageKitAuth(): Observable<{ signature: string, expire: number, token: string }> {
    return this.http.get<{ signature: string, expire: number, token: string }>(`${this.API_URL}/get-ik-token`);
  }
}
