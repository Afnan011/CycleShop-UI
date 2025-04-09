import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent {
  showAddModal = false;
  selectedType = 'All Types';
  selectedBrand = 'All Brands';
  searchQuery = '';

  cycles = [
    {
      model: 'Mountain X200',
      brand: 'Trek',
      type: 'Mountain Bike',
      price: 899.99,
      stock: 15
    },
    {
      model: 'Road Runner Pro',
      brand: 'Specialized',
      type: 'Road Bike',
      price: 1299.99,
      stock: 8
    }
  ];

  types = ['Mountain Bike', 'Road Bike', 'Hybrid Bike', 'BMX'];
  brands = ['Trek', 'Specialized', 'Giant', 'Cannondale'];

  filteredCycles() {
    return this.cycles.filter(cycle => {
      const matchesSearch = cycle.model.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                          cycle.brand.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                          cycle.type.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesType = this.selectedType === 'All Types' || cycle.type === this.selectedType;
      const matchesBrand = this.selectedBrand === 'All Brands' || cycle.brand === this.selectedBrand;
      return matchesSearch && matchesType && matchesBrand;
    });
  }

  editCycle(cycle: any) {
    this.newCycle = { ...cycle };
    this.showAddModal = true;
  }

  deleteCycle(cycle: any) {
    const index = this.cycles.findIndex(c => c.model === cycle.model && c.brand === cycle.brand);
    if (index !== -1) {
      this.cycles.splice(index, 1);
    }
  }

  newCycle = {
    model: '',
    brand: '',
    type: '',
    price: 0,
    stock: 0
  };

  toggleModal() {
    this.showAddModal = !this.showAddModal;
    if (!this.showAddModal) {
      this.resetForm();
    }
  }

  addCycle() {
    if (this.validateForm()) {
      this.cycles.push({...this.newCycle});
      this.toggleModal();
    }
  }

  validateForm(): boolean {
    return (
      this.newCycle.model.trim() !== '' &&
      this.newCycle.brand.trim() !== '' &&
      this.newCycle.type.trim() !== '' &&
      this.newCycle.price > 0 &&
      this.newCycle.stock >= 0
    );
  }

  resetForm() {
    this.newCycle = {
      model: '',
      brand: '',
      type: '',
      price: 0,
      stock: 0
    };
  }
}