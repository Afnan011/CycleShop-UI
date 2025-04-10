export interface CycleInventoryView {
    id: string;
    model: string;
    brand: string;
    type: string;
    price: number;
    costPrice: number;
    stockQuantity: number;
    reorderThreshold: number;
    warehouseLocation: string;
    description: string;
    imageUrl: string | null;
    sku: string;
    isActive: boolean;
    inventoryId: string;
    lastStockUpdate: string;
}

export interface Brand {
    id: string;
    name: string;
}

export interface Type {
    id: string;
    name: string;
}

export interface CycleCreate {
    modelName: string;
    brandId: string;
    typeId: string;
    price: number;
    costPrice: number;
}

export interface InventoryCreate {
    cycleId: string;
    stockQuantity: number;
    reorderThreshold: number;
    warehouseLocation: string;
}
