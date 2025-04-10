import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';
import { CycleInventoryView, Brand, Type } from '../../models/cycle.model';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  showAddModal = false;
  selectedType = 'All Types';
  selectedBrand = 'All Brands';
  searchQuery = '';
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  loading = false;
  error = '';

  cycles: CycleInventoryView[] = [];
  types: Type[] = [];
  brands: Brand[] = [];
  filteredCyclesList: CycleInventoryView[] = [];

  constructor(private inventoryService: InventoryService) {}

  ngOnInit() {
    this.loadData();
  }
  loadData() {
    this.loading = true;
    this.error = '';
    this.cycles = [];

    this.inventoryService.getCyclesWithInventory().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.cycles = data;
          console.log(data);
          this.updateFilters();
        } else {
          this.error = 'No inventory data found.';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading inventory:', err);
        this.error = err.status === 0
          ? 'Cannot connect to the server. Please check if the API is running.'
          : 'Failed to load inventory data. Please try again.';
        this.loading = false;
      }
    });
  }

  updateFilters() {
    if (!this.cycles) return;

    // Get unique brands and types from cycles
    const uniqueBrands = new Set(this.cycles.map(cycle => cycle.brand).filter(brand => brand));
    const uniqueTypes = new Set(this.cycles.map(cycle => cycle.type).filter(type => type));

    // Load full brand and type objects
    this.inventoryService.getBrands().subscribe({
      next: (brands) => {
        this.brands = brands.filter(brand => uniqueBrands.has(brand.name));
      },
      error: (err) => {
        console.error('Error loading brands:', err);
        this.error = 'Failed to load brands. Please try again.';
      }
    });

    this.inventoryService.getTypes().subscribe({
      next: (types) => {
        this.types = types.filter(type => uniqueTypes.has(type.name));
      },
      error: (err) => {
        console.error('Error loading types:', err);
        this.error = 'Failed to load types. Please try again.';
      }
    });
  }

  filteredCycles() {
    if (!this.cycles) {
      return [];
    }

    const filtered = this.cycles.filter(cycle => {
      const searchLower = (this.searchQuery || '').toLowerCase();
      const modelMatch = cycle.model.toLowerCase().includes(searchLower);
      const brandMatch = cycle.brand.toLowerCase().includes(searchLower);
      const typeMatch = cycle.type.toLowerCase().includes(searchLower);

      const matchesSearch = !this.searchQuery || modelMatch || brandMatch || typeMatch;
      const matchesType = this.selectedType === 'All Types' || cycle.type === this.selectedType;
      const matchesBrand = this.selectedBrand === 'All Brands' || cycle.brand === this.selectedBrand;

      return matchesSearch && matchesType && matchesBrand;
    });

    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    this.currentPage = Math.min(this.currentPage, this.totalPages);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  editCycle(cycle: CycleInventoryView) {
    // Implement edit functionality
    console.log('Edit cycle:', cycle);
  }

  deleteCycle(cycle: CycleInventoryView) {
    if (confirm('Are you sure you want to delete this cycle?')) {
      this.inventoryService.deleteCycle(cycle.id).subscribe({
        next: () => {
          this.loadData(); // Refresh the data
        },
        error: (err) => {
          console.error('Error deleting cycle:', err);
          this.error = 'Failed to delete cycle. Please try again.';
        }
      });
    }
  }

  newCycle = {
    model: '',
    brand: '',
    type: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    reorderThreshold: 5,
    warehouseLocation: ''
  };

  toggleModal() {
    this.showAddModal = !this.showAddModal;
    if (!this.showAddModal) {
      this.resetForm();
    }
  }

  addCycle() {
    if (!this.validateForm()) return;

    const selectedBrand = this.brands.find(b => b.name === this.newCycle.brand);
    const selectedType = this.types.find(t => t.name === this.newCycle.type);

    if (!selectedBrand || !selectedType) {
      this.error = 'Please select valid brand and type';
      return;
    }

    const cycleData = {
      modelName: this.newCycle.model,
      brandId: selectedBrand.id,
      typeId: selectedType.id,
      price: this.newCycle.price,
      costPrice: this.newCycle.costPrice
    };

    this.inventoryService.addCycle(cycleData).subscribe({
      next: (cycle) => {
        const inventoryData = {
          cycleId: cycle.id,
          stockQuantity: this.newCycle.stock,
          reorderThreshold: this.newCycle.reorderThreshold,
          warehouseLocation: this.newCycle.warehouseLocation
        };

        this.inventoryService.addInventory(inventoryData).subscribe({
          next: () => {
            this.loadData(); // Refresh the data
            this.toggleModal();
          },
          error: (err) => {
            console.error('Error adding inventory:', err);
            this.error = 'Failed to add inventory. Please try again.';
          }
        });
      },
      error: (err) => {
        console.error('Error adding cycle:', err);
        this.error = 'Failed to add cycle. Please try again.';
      }
    });
  }

  validateForm(): boolean {
    return (
      this.newCycle.model.trim() !== '' &&
      this.newCycle.brand !== '' &&
      this.newCycle.type !== '' &&
      this.newCycle.price > 0 &&
      this.newCycle.costPrice > 0 &&
      this.newCycle.stock >= 0 &&
      this.newCycle.warehouseLocation.trim() !== '' &&
      this.newCycle.reorderThreshold > 0
    );
  }

  resetForm() {
    this.newCycle = {
      model: '',
      brand: '',
      type: '',
      price: 0,
      costPrice: 0,
      stock: 0,
      reorderThreshold: 5,
      warehouseLocation: ''
    };
  }
}
