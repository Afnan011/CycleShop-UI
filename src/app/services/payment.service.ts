import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  private getAuthHeaders(): HttpHeaders {
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
      throw new Error('No authentication token found. Please log in.');
    }
    const currentUser = JSON.parse(currentUserStr);
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentUser.token}`
    });
  }

  constructor(private http: HttpClient) {}

  processPayment(paymentRequest: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, paymentRequest,  { headers: this.getAuthHeaders() });
  }

  getPaymentStatus(paymentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${paymentId}` , { headers: this.getAuthHeaders() });
  }

  getPaymentsByOrder(orderId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/order/${orderId}`, { headers: this.getAuthHeaders() });
  }

  processStripePayment(paymentRequest: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/stripe`, paymentRequest, { headers: this.getAuthHeaders() });
  }

  processRazorpayPayment(paymentRequest: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/razorpay/create-order`, paymentRequest, { headers: this.getAuthHeaders() });
  }

  verifyRazorpayPayment(verificationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/razorpay/verify-payment`, verificationData, { headers: this.getAuthHeaders() });
  }
}
