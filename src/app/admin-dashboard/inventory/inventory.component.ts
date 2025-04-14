import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { InventoryService } from '../../services/inventory.service';
import { CycleInventoryView, Brand, CycleType, CycleCreate, InventoryCreate, CycleEdit } from '../../models/cycle.model';
import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploadComponent],
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
  types: CycleType[] = [];
  brands: Brand[] = [];
  filteredCyclesList: CycleInventoryView[] = [];

  showEditModal = false;
  editingCycle: CycleEdit = {
    modelName: '',
    brandName: '',
    typeName: '',
    price: 0,
    costPrice: 0,
    description: '',
    stockQuantity: 0,
    reorderThreshold: 5,
    warehouseLocation: '',
    isActive: true
  };
  currentCycleId = '';
  currentInventoryId = '';

  sortField: string = 'model';  
  sortDirection: 'asc' | 'desc' = 'asc';  

  imagePreview: string | null = null;
  editImagePreview: string | null = null;

  constructor(
    private inventoryService: InventoryService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = '';
    this.cycles = [];

    this.inventoryService.getCyclesWithInventory().subscribe({
      next: (data: CycleInventoryView[]) => {
        if (data && data.length > 0) {
          this.cycles = data;
          console.log('Cycles:', this.cycles);
          this.updateFilters();
        } else {
          this.error = 'No inventory data found.';
        }
        this.loading = false;
      },
      error: (err: Error) => {
        console.error('Error loading inventory:', err);
        this.error =
          err.message === '0'
            ? 'Cannot connect to the server. Please check if the API is running.'
            : 'Failed to load inventory data. Please try again.';
        this.loading = false;
      },
    });
  }

  updateFilters() {
    if (!this.cycles) return;

    const uniqueBrands = new Set(
      this.cycles.map((cycle) => cycle.brand).filter((brand) => brand)
    );
    const uniqueTypes = new Set(
      this.cycles.map((cycle) => cycle.type).filter((type) => type)
    );

    this.inventoryService.getBrands().subscribe({
      next: (brands) => {
        this.brands = brands.filter((brand) => uniqueBrands.has(brand.name));
      },
      error: (err) => {
        console.error('Error loading brands:', err);
        this.error = 'Failed to load brands. Please try again.';
      },
    });

    this.inventoryService.getTypes().subscribe({
      next: (types) => {
        this.types = types.filter((type) => uniqueTypes.has(type.name));
      },
      error: (err) => {
        console.error('Error loading types:', err);
        this.error = 'Failed to load types. Please try again.';
      },
    });
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
    if (!this.cycles) {
      return [];
    }

    let filtered = this.cycles.filter((cycle) => {
      const searchLower = (this.searchQuery || '').toLowerCase();
      const modelMatch = cycle.model.toLowerCase().includes(searchLower);
      const brandMatch = cycle.brand.toLowerCase().includes(searchLower);
      const typeMatch = cycle.type.toLowerCase().includes(searchLower);

      const matchesSearch =
        !this.searchQuery || modelMatch || brandMatch || typeMatch;
      const matchesType =
        this.selectedType === 'All Types' || cycle.type === this.selectedType;
      const matchesBrand =
        this.selectedBrand === 'All Brands' ||
        cycle.brand === this.selectedBrand;

      return matchesSearch && matchesType && matchesBrand;
    });

    // Apply sorting if a sort field is selected
    if (this.sortField) {
      filtered = filtered.sort((a, b) => {
        let aValue = a[this.sortField as keyof CycleInventoryView];
        let bValue = b[this.sortField as keyof CycleInventoryView];

        // Handle numeric values
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return this.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Handle string values
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();

        if (this.sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

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
    this.currentCycleId = cycle.id;
    this.currentInventoryId = cycle.inventoryId;
    this.editingCycle = {
      modelName: cycle.model,
      brandName: cycle.brand,
      typeName: cycle.type,
      price: cycle.price,
      costPrice: cycle.costPrice,
      description: cycle.description,
      stockQuantity: cycle.stockQuantity,
      reorderThreshold: cycle.reorderThreshold,
      warehouseLocation: cycle.warehouseLocation,
      isActive: cycle.isActive,
      imageUrl: cycle.imageUrl || undefined
    };
    this.showEditModal = true;
  }

  toggleEditModal() {
    this.showEditModal = !this.showEditModal;
    if (!this.showEditModal) {
      this.resetEditForm();
    }
  }

  resetEditForm() {
    this.editingCycle = {
      modelName: '',
      brandName: '',
      typeName: '',
      price: 0,
      costPrice: 0,
      description: '',
      stockQuantity: 0,
      reorderThreshold: 5,
      warehouseLocation: '',
      isActive: true
    };
    this.currentCycleId = '';
    this.currentInventoryId = '';
    this.removeEditImage();
  }

  validateEditForm(): boolean {
    return (
      this.editingCycle.modelName?.trim() !== '' &&
      this.editingCycle.brandName !== '' &&
      this.editingCycle.typeName !== '' &&
      this.editingCycle.price > 0 &&
      this.editingCycle.costPrice > 0 &&
      this.editingCycle.stockQuantity >= 0 &&
      this.editingCycle.reorderThreshold > 0 &&
      this.editingCycle.warehouseLocation?.trim() !== '' &&
      this.editingCycle.description?.trim() !== ''
    );
  }

  async saveEdit() {
    if (!this.validateEditForm()) {
      this.toastr.error('Please fill in all required fields correctly');
      return;
    }

    try {
      const brandId = await this.inventoryService.getBrandByName(this.editingCycle.brandName).toPromise();
      const typeId = await this.inventoryService.getTypeByName(this.editingCycle.typeName).toPromise();

      if (!brandId || !typeId) {
        this.toastr.error('Invalid brand or type selected');
        return;
      }

      console.log('save edits:', this.editingCycle);

      await this.inventoryService.updateCycle(this.currentCycleId, {
        modelName: this.editingCycle.modelName,
        brandId,
        typeId,
        description: this.editingCycle.description,
        price: this.editingCycle.price,
        costPrice: this.editingCycle.costPrice,
        isActive: this.editingCycle.isActive,
        imageUrl: this.editingCycle.imageUrl || undefined 
      }).toPromise();

      await this.inventoryService.updateInventory(this.currentInventoryId, {
        stockQuantity: this.editingCycle.stockQuantity,
        reorderThreshold: this.editingCycle.reorderThreshold,
        warehouseLocation: this.editingCycle.warehouseLocation
      }).toPromise();

      this.toastr.success('Cycle updated successfully');
      this.loadCycles();
      this.toggleEditModal();
    } catch (error) {
      console.error('Error updating cycle:', error);
      this.toastr.error('Failed to update cycle');
    }
  }

  deleteCycle(cycle: CycleInventoryView) {
    if (confirm('Are you sure you want to delete this cycle?')) {
      this.inventoryService.deleteCycle(cycle.id).subscribe({
        next: () => {
          this.loadData();
        },
        error: (err) => {
          console.error('Error deleting cycle:', err);
          this.error = 'Failed to delete cycle. Please try again.';
        },
      });
    }
  }
  newCycle = {
    model: '123',
    brandName: '',
    typeName: '',
    price: 130,
    costPrice: 110,
    stock: 10,
    reorderThreshold: 5,
    warehouseLocation: 'A1',
    description: 'test description',
  };

  toggleModal() {
    this.showAddModal = !this.showAddModal;
    if (!this.showAddModal) {
      this.resetForm();
    }
  }

  onImageUploadSuccess(url: string) {
    this.imagePreview = url;
  }

  onEditImageUploadSuccess(url: string) {
    this.editImagePreview = url;
    this.editingCycle.imageUrl = url;
  }

  onImageUploadError(error: any) {
    console.error('Error uploading image:', error);
    this.toastr.error('Failed to upload image');
  }

  removeImage() {
    this.imagePreview = null;
  }

  removeEditImage() {
    this.editImagePreview = null;
    this.editingCycle.imageUrl = undefined;
  }

  async addCycle() {
    let brandId: string = '';
    let typeId: string = '';

    const brandObservable = this.inventoryService.getBrandByName(
      this.newCycle.brandName
    );
    const typeObservable = this.inventoryService.getTypeByName(
      this.newCycle.typeName
    );

    forkJoin([brandObservable, typeObservable]).subscribe({
      next: async ([brandIdResponse, typeIdResponse]) => {
        brandId = brandIdResponse ?? '';
        typeId = typeIdResponse ?? '';

        if (!this.validateForm()) return;

        const cycleData: CycleCreate = {
          modelName: this.newCycle.model,
          brandId: brandId,
          typeId: typeId,
          price: this.newCycle.price,
          costPrice: this.newCycle.costPrice,
          description: this.newCycle.description,
          isActive: true,
          imageUrl: this.imagePreview || undefined
        };

        this.saveCycleData(cycleData);
      },
      error: (err) => {
        this.toastr.error('Failed to Add new Cycle', 'Error');
        console.error('Error fetching brand/type IDs:', err);
        this.error = 'Failed to fetch brand/type IDs. Please try again.';
      },
    });
  }

  saveCycleData(cycleData: CycleCreate) {
    this.inventoryService.addCycle(cycleData).subscribe({
      next: (cycle) => {
        const inventoryData = {
          cycleId: cycle.cycleId,
          stockQuantity: this.newCycle.stock,
          reorderThreshold: this.newCycle.reorderThreshold,
          warehouseLocation: this.newCycle.warehouseLocation,
        };

        this.inventoryService.addInventory(inventoryData).subscribe({
          next: () => {
            this.loadData();
            this.toggleModal();
          },
          error: (err) => {
            this.toastr.error('Failed to Add new Cycle', 'Error');
            console.error('Error adding inventory:', err);
            this.error = 'Failed to add inventory. Please try again.';
          },
        });
      },
      error: (err) => {
        this.toastr.error('Failed to Add new Cycle', 'Error');
        console.error('Error adding cycle:', err);
        this.error = 'Failed to add cycle. Please try again.';
      },
    });
  }

  validateForm(): boolean {
    return (
      this.newCycle.model.trim() !== '' &&
      this.newCycle.brandName !== '' &&
      this.newCycle.typeName !== '' &&
      this.newCycle.price > 0 &&
      this.newCycle.costPrice > 0 &&
      this.newCycle.stock >= 0 &&
      this.newCycle.warehouseLocation.trim() !== '' &&
      this.newCycle.reorderThreshold > 0 &&
      this.newCycle.description.trim() !== ''
    );
  }

  resetForm() {
    this.newCycle = {
      model: '',
      brandName: '',
      typeName: '',
      price: 0,
      costPrice: 0,
      stock: 0,
      reorderThreshold: 5,
      warehouseLocation: '',
      description: '',
    };
    this.removeImage();
  }

  viewCycle(cycle: CycleInventoryView) {
    this.router.navigate(['/admin/dashboard/inventory', cycle.id]);
  }

  loadCycles() {
    this.inventoryService.getCyclesWithInventory().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.cycles = data;
          this.updateFilters();
        }
      },
      error: (err) => {
        console.error('Error refreshing inventory:', err);
        this.toastr.error('Failed to refresh inventory data');
      }
    });
  }
}
