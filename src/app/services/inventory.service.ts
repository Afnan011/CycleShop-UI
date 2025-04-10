import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CycleInventoryView, Brand, Type, CycleCreate, InventoryCreate } from '../models/cycle.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }
  getCyclesWithInventory(): Observable<CycleInventoryView[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Inventory`).pipe(
      map(inventories => inventories.map(inv => ({
        id: inv.cycle.cycleId,
        model: inv.cycle.modelName,
        brand: inv.cycle.brand.name,
        type: inv.cycle.cycleType.name,
        price: inv.cycle.price,
        costPrice: inv.cycle.costPrice,
        stockQuantity: inv.stockQuantity,
        reorderThreshold: inv.reorderThreshold,
        warehouseLocation: inv.warehouseLocation,
        description: inv.cycle.description,
        imageUrl: inv.cycle.imageUrl,
        sku: inv.cycle.sku,
        isActive: inv.cycle.isActive,
        inventoryId: inv.inventoryId,
        lastStockUpdate: inv.lastStockUpdate
      })))
    );
  }

  getBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${this.apiUrl}/Brands`);
  }

  getTypes(): Observable<Type[]> {
    return this.http.get<Type[]>(`${this.apiUrl}/CycleTypes`);
  }

  addCycle(cycle: CycleCreate): Observable<any> {
    return this.http.post(`${this.apiUrl}/Cycles`, cycle);
  }

  addInventory(inventory: InventoryCreate): Observable<any> {
    return this.http.post(`${this.apiUrl}/Inventory`, inventory);
  }

  deleteCycle(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Cycles/${id}`);
  }
}
