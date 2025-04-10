import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CycleInventoryView, Brand, CycleType, CycleCreate, InventoryCreate } from '../models/cycle.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = environment.apiUrl;
  brandMap: { [key: string]: string } = {};

  constructor(private http: HttpClient) { }

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

  getBrandByName(name: string): Observable<string | null> {
    return this.getBrands().pipe(
      map(brands => {
        const foundBrand = brands.find((brand) => brand.name === name);
        return foundBrand ? foundBrand.brandId : null;
      })
    );
  }


  getTypes(): Observable<CycleType[]> {
    return this.http.get<CycleType[]>(`${this.apiUrl}/CycleTypes`);
  }

  getTypeByName(name: string): Observable<string | null> {
    return this.getTypes().pipe(
      map(types => {
        const foundType = types.find((type) => type.name === name);
        return foundType ? foundType.cycleTypeId : null;
      })
    );
  }

  addCycle(cycle: CycleCreate): Observable<any> {
    return this.http.post(`${this.apiUrl}/Cycles`, cycle, { headers: this.getAuthHeaders() });
  }

  addInventory(inventory: InventoryCreate): Observable<any> {
    return this.http.post(`${this.apiUrl}/Inventory`, inventory, { headers: this.getAuthHeaders() });
  }

  deleteCycle(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Cycles/${id}`, { headers: this.getAuthHeaders() });
  }
}
