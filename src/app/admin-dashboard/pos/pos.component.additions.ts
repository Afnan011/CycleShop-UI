import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';

// Add to your existing imports and update the PosComponent class

async proceedToCheckout() {
  try {
    // Create order object from cart items
    const order = {
      items: this.cartItems.map(item => ({
        cycleId: item.cycle.id,
        quantity: item.quantity,
        priceSnapshot: item.cycle.price
      })),
      subtotal: this.getSubtotal(),
      tax: this.getTax(),
      total: this.getTotal()
    };

    // Navigate to payment component with order data
    this.router.navigate(['/admin/payment'], { state: { order } });
  } catch (error) {
    console.error('Error proceeding to checkout:', error);
  }
}
