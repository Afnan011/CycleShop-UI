export interface CycleEdit {
    modelName: string;
    brandName: string;
    typeName: string;
    price: number;
    costPrice: number;
    description: string;
    stockQuantity: number;
    reorderThreshold: number;
    warehouseLocation: string;
    isActive: boolean;
    imageUrl?: string;
}

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
    brandId: string;
    name: string;
    description?: string;
}

export interface CycleType {
    cycleTypeId: string;
    name: string;
}

export interface CycleCreate {
    modelName: string;
    brandId: string;  // We want this to be required as it maps to non-nullable Guid in C#
    typeId: string;   // We want this to be required as it maps to non-nullable Guid in C#
    price: number;
    costPrice: number;
    description: string;
    isActive?: boolean;
    imageUrl?: string;
}

export interface InventoryCreate {
    cycleId: string;
    stockQuantity: number;
    reorderThreshold: number;
    warehouseLocation: string;
}
