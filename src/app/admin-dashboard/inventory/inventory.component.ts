import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CycleInventoryView, Brand, CycleType } from '../../models/cycle.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { CycleFormComponent } from '../../shared/components/cycle-form/cycle-form.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { InventoryStateService } from '../../services/inventory-state.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ModalComponent, CycleFormComponent, ConfirmModalComponent, FormsModule], 
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  // View state
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedCycleToDelete: CycleInventoryView | null = null;
  selectedType = 'All Types';
  selectedBrand = 'All Brands';
  searchQuery = '';
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  sortField: string = 'model';
  sortDirection: 'asc' | 'desc' = 'asc';
  isAdmin: boolean = false;

  // Data state
  cycles: CycleInventoryView[] = [];
  types: CycleType[] = [];
  brands: Brand[] = [];
  loading = false;
  error = '';

  // Form state
  editingCycle: any = {};
  newCycle: any = {
    modelName: '',
    brandName: '',
    typeName: '',
    price: 0,
    costPrice: 0,
    stockQuantity: 0,
    reorderThreshold: 5,
    warehouseLocation: '',
    description: '',
    isActive: true
  };

  constructor(
    private inventoryState: InventoryStateService,
    private toastr: ToastrService,
    private router: Router,
    private authService: AuthService
  ) {
    // Check if the current user is an admin
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.isAdmin = currentUser.role === 'admin';
    }
  }

  ngOnInit() {
    // Subscribe to state updates
    this.inventoryState.cycles$.subscribe(cycles => {
      this.cycles = cycles;
      this.updatePagination();
    });

    this.inventoryState.brands$.subscribe(brands => this.brands = brands);
    this.inventoryState.types$.subscribe(types => this.types = types);
    this.inventoryState.loading$.subscribe(loading => this.loading = loading);
    this.inventoryState.error$.subscribe(error => this.error = error);

    // Initial data load
    this.loadData();
  }

  loadData() {
    this.inventoryState.loadInventoryData();
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
  }
  filteredCycles() {
    if (!this.cycles) return [];

    let filtered = this.cycles.filter(cycle => {
      const searchLower = (this.searchQuery || '').toLowerCase();
      const modelMatch = cycle.model.toLowerCase().includes(searchLower);
      const brandMatch = cycle.brand.toLowerCase().includes(searchLower);
      const typeMatch = cycle.type.toLowerCase().includes(searchLower);

      const matchesSearch = !this.searchQuery || modelMatch || brandMatch || typeMatch;
      const matchesType = this.selectedType === 'All Types' || cycle.type === this.selectedType;
      const matchesBrand = this.selectedBrand === 'All Brands' || cycle.brand === this.selectedBrand;

      return matchesSearch && matchesType && matchesBrand;
    });

    // Apply sorting
    if (this.sortField) {
      filtered = filtered.sort((a, b) => {
        let aValue = a[this.sortField as keyof CycleInventoryView];
        let bValue = b[this.sortField as keyof CycleInventoryView];

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return this.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();

        return this.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });    }

    // Update pagination based on filtered results
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    this.currentPage = Math.min(this.currentPage, this.totalPages);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }

  updatePagination() {
    this.totalPages = Math.max(1, Math.ceil(this.cycles.length / this.pageSize));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
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
  onAddCycleSubmit(formData: any) {
    // First, get the brand ID from brand name
    this.inventoryState.inventoryService.getBrandByName(formData.brandName).subscribe({
      next: (brandId) => {
        if (!brandId) {
          this.toastr.error('Selected brand not found');
          return;
        }
        // Then, get the type ID from type name
        this.inventoryState.inventoryService.getTypeByName(formData.typeName).subscribe({
          next: (typeId) => {
            if (!typeId) {
              this.toastr.error('Selected type not found');
              return;
            }
            // Now we have both IDs, we can create the cycle
            console.log(formData);
            console.log('imageUrL' + ' ' + formData.imageUrl);
            this.inventoryState.addCycle(
              {
                modelName: formData.modelName,
                brandId: brandId,
                typeId: typeId,
                price: formData.price,
                costPrice: formData.costPrice,
                description: formData.description,
                isActive: true,
                imageUrl: formData.imageUrl
              },
              {
                stockQuantity: formData.stockQuantity,
                reorderThreshold: formData.reorderThreshold,
                warehouseLocation: formData.warehouseLocation
              }
            );
            this.showAddModal = false;
            this.toastr.success('Cycle added successfully');
          },
          error: (err) => {
            console.error('Error getting type ID:', err);
            this.toastr.error('Error getting type ID');
          }
        });
      },
      error: (err) => {
        console.error('Error getting brand ID:', err);
        this.toastr.error('Error getting brand ID');
      }
    });
  }
  onEditCycleSubmit(formData: any) {
    // First, get the brand ID from brand name
    this.inventoryState.inventoryService.getBrandByName(formData.brandName).subscribe({
      next: (brandId) => {
        if (!brandId) {
          this.toastr.error('Selected brand not found');
          return;
        }
        // Then, get the type ID from type name
        this.inventoryState.inventoryService.getTypeByName(formData.typeName).subscribe({
          next: (typeId) => {
            if (!typeId) {
              this.toastr.error('Selected type not found');
              return;
            }
            // Now we have both IDs, we can update the cycle
            this.inventoryState.updateCycle(
              this.editingCycle.id,
              {
                modelName: formData.modelName,
                brandId: brandId,
                typeId: typeId,
                price: formData.price,
                costPrice: formData.costPrice,
                description: formData.description,
                isActive: formData.isActive,
                imageUrl: formData.imageUrl
              },
              this.editingCycle.inventoryId,
              {
                stockQuantity: formData.stockQuantity,
                reorderThreshold: formData.reorderThreshold,
                warehouseLocation: formData.warehouseLocation
              }
            );
            this.showEditModal = false;
            this.toastr.success('Cycle updated successfully');
          },
          error: (err) => {
            console.error('Error getting type ID:', err);
            this.toastr.error('Error getting type ID');
          }
        });
      },
      error: (err) => {
        console.error('Error getting brand ID:', err);
        this.toastr.error('Error getting brand ID');
      }
    });
  }
  editCycle(cycle: CycleInventoryView) {
    // Map the cycle data to match the form structure
    this.editingCycle = {
      id: cycle.id,
      modelName: cycle.model,
      brandName: cycle.brand,
      typeName: cycle.type,
      price: cycle.price,
      costPrice: cycle.costPrice,
      stockQuantity: cycle.stockQuantity,
      reorderThreshold: cycle.reorderThreshold,
      warehouseLocation: cycle.warehouseLocation,
      description: cycle.description,
      isActive: cycle.isActive,
      imageUrl: cycle.imageUrl,
      inventoryId: cycle.inventoryId
    };
    this.showEditModal = true;
  }

  deleteCycle(cycle: CycleInventoryView) {
    this.selectedCycleToDelete = cycle;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (this.selectedCycleToDelete) {
      this.inventoryState.deleteCycle(this.selectedCycleToDelete.id);
      this.toastr.success('Cycle deleted successfully');
      this.showDeleteModal = false;
      this.selectedCycleToDelete = null;
    }
  }

  viewCycle(cycle: CycleInventoryView) {
    this.router.navigate(['/admin/dashboard/inventory', cycle.id]);
  }
}
