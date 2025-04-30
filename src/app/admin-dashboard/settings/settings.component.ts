import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Brand, CycleType } from '../../models/cycle.model';
import { InventoryService } from '../../services/inventory.service';
import { InventoryStateService } from '../../services/inventory-state.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModalComponent,
    ConfirmModalComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  // Active tab state
  activeTab: 'general' | 'brands' | 'types' = 'general';

  // Data collections
  brands: Brand[] = [];
  cycleTypes: CycleType[] = [];

  // UI states
  loadingBrands = false;
  loadingTypes = false;
  showAddBrandModal = false;
  showEditBrandModal = false;
  showAddTypeModal = false;
  showEditTypeModal = false;
  showDeleteBrandModal = false;
  showDeleteTypeModal = false;
  
  // Selected items for edit/delete
  selectedBrand: Brand | null = null;
  selectedType: CycleType | null = null;
  
  // Forms
  brandForm: FormGroup;
  typeForm: FormGroup;

  constructor(
    private inventoryService: InventoryService,
    private inventoryState: InventoryStateService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService
  ) {
    // Initialize forms
    this.brandForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      description: ['']
    });

    this.typeForm = this.formBuilder.group({
      name: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadBrands();
    this.loadCycleTypes();
  }

  // Tab navigation
  setActiveTab(tab: 'general' | 'brands' | 'types'): void {
    this.activeTab = tab;
  }

  // Brand management functions
  loadBrands(): void {
    this.loadingBrands = true;
    this.inventoryService.getBrands().subscribe({
      next: (brands) => {
        this.brands = brands;
        this.loadingBrands = false;
      },
      error: (error) => {
        console.error('Error loading brands:', error);
        this.toastr.error('Failed to load brands');
        this.loadingBrands = false;
      }
    });
  }

  openAddBrandModal(): void {
    this.brandForm.reset();
    this.showAddBrandModal = true;
  }

  openEditBrandModal(brand: Brand): void {
    this.selectedBrand = brand;
    this.brandForm.patchValue({
      name: brand.name,
      description: brand.description || ''
    });
    this.showEditBrandModal = true;
  }

  openDeleteBrandModal(brand: Brand): void {
    this.selectedBrand = brand;
    this.showDeleteBrandModal = true;
  }

  addBrand(): void {
    if (this.brandForm.invalid) {
      this.toastr.error('Please fill in all required fields');
      return;
    }

    const brandData = {
      name: this.brandForm.value.name,
      description: this.brandForm.value.description
    };

    this.inventoryService.createBrand(brandData).subscribe({
      next: () => {
        this.toastr.success('Brand added successfully');
        this.loadBrands();
        this.showAddBrandModal = false;
        this.brandForm.reset();
      },
      error: (error) => {
        console.error('Error adding brand:', error);
        this.toastr.error('Failed to add brand');
      }
    });
  }

  updateBrand(): void {
    if (this.brandForm.invalid || !this.selectedBrand) {
      this.toastr.error('Please fill in all required fields');
      return;
    }

    const brandData = {
      name: this.brandForm.value.name,
      description: this.brandForm.value.description
    };

    this.inventoryService.updateBrand(this.selectedBrand.brandId, brandData).subscribe({
      next: () => {
        this.toastr.success('Brand updated successfully');
        this.loadBrands();
        this.showEditBrandModal = false;
        this.selectedBrand = null;
        this.brandForm.reset();
      },
      error: (error) => {
        console.error('Error updating brand:', error);
        this.toastr.error('Failed to update brand');
      }
    });
  }

  deleteBrand(): void {
    if (!this.selectedBrand) return;

    this.inventoryService.deleteBrand(this.selectedBrand.brandId).subscribe({
      next: () => {
        this.toastr.success('Brand deleted successfully');
        this.loadBrands();
        this.showDeleteBrandModal = false;
        this.selectedBrand = null;
      },
      error: (error) => {
        console.error('Error deleting brand:', error);
        this.toastr.error('Failed to delete brand. It may be in use by existing cycles.');
      }
    });
  }

  // Cycle Type management functions
  loadCycleTypes(): void {
    this.loadingTypes = true;
    this.inventoryService.getTypes().subscribe({
      next: (types) => {
        this.cycleTypes = types;
        this.loadingTypes = false;
      },
      error: (error) => {
        console.error('Error loading cycle types:', error);
        this.toastr.error('Failed to load cycle types');
        this.loadingTypes = false;
      }
    });
  }

  openAddTypeModal(): void {
    this.typeForm.reset();
    this.showAddTypeModal = true;
  }

  openEditTypeModal(type: CycleType): void {
    this.selectedType = type;
    this.typeForm.patchValue({
      name: type.name
    });
    this.showEditTypeModal = true;
  }

  openDeleteTypeModal(type: CycleType): void {
    this.selectedType = type;
    this.showDeleteTypeModal = true;
  }

  addCycleType(): void {
    if (this.typeForm.invalid) {
      this.toastr.error('Please fill in all required fields');
      return;
    }

    const typeName = this.typeForm.value.name;

    this.inventoryService.createCycleType(typeName).subscribe({
      next: () => {
        this.toastr.success('Cycle type added successfully');
        this.loadCycleTypes();
        this.showAddTypeModal = false;
        this.typeForm.reset();
      },
      error: (error) => {
        console.error('Error adding cycle type:', error);
        this.toastr.error('Failed to add cycle type');
      }
    });
  }

  updateCycleType(): void {
    if (this.typeForm.invalid || !this.selectedType) {
      this.toastr.error('Please fill in all required fields');
      return;
    }

    const typeName = this.typeForm.value.name;

    this.inventoryService.updateCycleType(this.selectedType.cycleTypeId, typeName).subscribe({
      next: () => {
        this.toastr.success('Cycle type updated successfully');
        this.loadCycleTypes();
        this.showEditTypeModal = false;
        this.selectedType = null;
        this.typeForm.reset();
      },
      error: (error) => {
        console.error('Error updating cycle type:', error);
        this.toastr.error('Failed to update cycle type');
      }
    });
  }

  deleteCycleType(): void {
    if (!this.selectedType) return;

    this.inventoryService.deleteCycleType(this.selectedType.cycleTypeId).subscribe({
      next: () => {
        this.toastr.success('Cycle type deleted successfully');
        this.loadCycleTypes();
        this.showDeleteTypeModal = false;
        this.selectedType = null;
      },
      error: (error) => {
        console.error('Error deleting cycle type:', error);
        this.toastr.error('Failed to delete cycle type. It may be in use by existing cycles.');
      }
    });
  }
}
