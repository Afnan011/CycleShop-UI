import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CycleInventoryView, Brand, CycleType } from '../models/cycle.model';
import { InventoryService } from './inventory.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryStateService {
  private cyclesSubject = new BehaviorSubject<CycleInventoryView[]>([]);
  private brandsSubject = new BehaviorSubject<Brand[]>([]);
  private typesSubject = new BehaviorSubject<CycleType[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string>('');

  cycles$ = this.cyclesSubject.asObservable();
  brands$ = this.brandsSubject.asObservable();
  types$ = this.typesSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(private inventoryService: InventoryService) {}

  loadInventoryData() {
    this.loadingSubject.next(true);
    this.errorSubject.next('');

    this.inventoryService.getCyclesWithInventory().subscribe({
      next: (data) => {
        this.cyclesSubject.next(data);
        this.updateFilters(data);
        this.loadingSubject.next(false);
      },
      error: (err) => {
        console.error('Error loading inventory:', err);
        this.errorSubject.next(err.message || 'Failed to load inventory data');
        this.loadingSubject.next(false);
      }
    });
  }

  private updateFilters(cycles: CycleInventoryView[]) {
    const uniqueBrands = new Set(cycles.map(cycle => cycle.brand));
    const uniqueTypes = new Set(cycles.map(cycle => cycle.type));

    this.inventoryService.getBrands().subscribe({
      next: (brands) => this.brandsSubject.next(
        brands.filter(brand => uniqueBrands.has(brand.name))
      ),
      error: (err) => console.error('Error loading brands:', err)
    });

    this.inventoryService.getTypes().subscribe({
      next: (types) => this.typesSubject.next(
        types.filter(type => uniqueTypes.has(type.name))
      ),
      error: (err) => console.error('Error loading types:', err)
    });
  }

  addCycle(cycle: any, inventory: any) {
    this.loadingSubject.next(true);
    this.inventoryService.addCycle(cycle).subscribe({
      next: (newCycle) => {
        this.inventoryService.addInventory({
          ...inventory,
          cycleId: newCycle.cycleId
        }).subscribe({
          next: () => this.loadInventoryData(),
          error: (err) => {
            console.error('Error adding inventory:', err);
            this.errorSubject.next('Failed to add inventory');
            this.loadingSubject.next(false);
          }
        });
      },
      error: (err) => {
        console.error('Error adding cycle:', err);
        this.errorSubject.next('Failed to add cycle');
        this.loadingSubject.next(false);
      }
    });
  }

  updateCycle(cycleId: string, cycle: any, inventoryId: string, inventory: any) {
    this.loadingSubject.next(true);

    this.inventoryService.updateCycle(cycleId, cycle).subscribe({
      next: () => {
        this.inventoryService.updateInventory(inventoryId, inventory).subscribe({
          next: () => this.loadInventoryData(),
          error: (err) => {
            console.error('Error updating inventory:', err);
            this.errorSubject.next('Failed to update inventory');
            this.loadingSubject.next(false);
          }
        });
      },
      error: (err) => {
        console.error('Error updating cycle:', err);
        this.errorSubject.next('Failed to update cycle');
        this.loadingSubject.next(false);
      }
    });
  }

  deleteCycle(cycleId: string) {
    this.loadingSubject.next(true);
    this.inventoryService.deleteCycle(cycleId).subscribe({
      next: () => this.loadInventoryData(),
      error: (err) => {
        console.error('Error deleting cycle:', err);
        this.errorSubject.next('Failed to delete cycle');
        this.loadingSubject.next(false);
      }
    });
  }
}
