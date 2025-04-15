import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CycleInventoryView } from '../../models/cycle.model';
import { InventoryStateService } from '../../services/inventory-state.service';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss']
})
export class PosComponent implements OnInit {
  cycles: CycleInventoryView[] = [];
  filteredCycles: CycleInventoryView[] = [];
  cartItems: {cycle: CycleInventoryView, quantity: number}[] = [];
  searchQuery = '';
  selectedType = 'All Types';
  selectedBrand = 'All Brands';
  types: string[] = [];
  brands: string[] = [];
  showProductDetails = false;
  selectedCycle: CycleInventoryView | null = null;
  isCartExpanded = false; // Default to hidden cart

  toggleCart() {
    this.isCartExpanded = !this.isCartExpanded;
    console.log('Cart expanded:', this.isCartExpanded);
  }

  constructor(
    private inventoryState: InventoryStateService,
    private router: Router
  ) {}

  ngOnInit() {
    this.inventoryState.cycles$.subscribe(cycles => {
      this.cycles = cycles;
      this.filterCycles();
    });

    this.inventoryState.brands$.subscribe(brands => {
      this.brands = brands.map(b => b.name);
    });

    this.inventoryState.types$.subscribe(types => {
      this.types = types.map(t => t.name);
    });

    this.loadData();
  }

  loadData() {
    this.inventoryState.loadInventoryData();
  }

  filterCycles() {
    this.filteredCycles = this.cycles.filter(cycle => {
      const matchesSearch = cycle.model.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                          cycle.brand.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesType = this.selectedType === 'All Types' || cycle.type === this.selectedType;
      const matchesBrand = this.selectedBrand === 'All Brands' || cycle.brand === this.selectedBrand;

      return matchesSearch && matchesType && matchesBrand;
    });
  }

  viewCycleDetails(cycle: CycleInventoryView) {
    this.selectedCycle = cycle;
    this.showProductDetails = true;
  }

  closeProductDetails() {
    this.showProductDetails = false;
    this.selectedCycle = null;
  }
  addToCart(cycle: CycleInventoryView) {
    if (cycle.stockQuantity === 0) {
      return;
    }

    const existingItem = this.cartItems.find(item => item.cycle.id === cycle.id);
    if (existingItem) {
      if (existingItem.quantity < cycle.stockQuantity) {
        existingItem.quantity++;
      }
    } else {
      this.cartItems.push({ cycle, quantity: 1 });
    }
    this.closeProductDetails();
  }

  removeFromCart(cycleId: string) {
    const index = this.cartItems.findIndex(item => item.cycle.id === cycleId);
    if (index !== -1) {
      this.cartItems.splice(index, 1);
    }
  }

  updateQuantity(item: {cycle: CycleInventoryView, quantity: number}, newQuantity: number) {
    if (newQuantity > 0 && newQuantity <= item.cycle.stockQuantity) {
      item.quantity = newQuantity;
    }
  }

  getSubtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.cycle.price * item.quantity), 0);
  }

  getTax(): number {
    return this.getSubtotal() * 0.18; // 18% tax
  }

  getTotal(): number {
    return this.getSubtotal() + this.getTax();
  }

  handleImageError(event: Event): void {
    if (event.target instanceof HTMLImageElement) {
      event.target.src = 'assets/images/default_cycle2.jpg';
    }
  }
}
