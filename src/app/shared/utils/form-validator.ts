export class FormValidator {
  static validateCycleForm(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.modelName?.trim()) {
      errors.push('Model name is required');
    }

    if (!data.brandName) {
      errors.push('Brand is required');
    }

    if (!data.typeName) {
      errors.push('Type is required');
    }

    if (!data.price || data.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (!data.costPrice || data.costPrice <= 0) {
      errors.push('Cost price must be greater than 0');
    }

    if (!data.stockQuantity || data.stockQuantity < 0) {
      errors.push('Stock quantity cannot be negative');
    }

    if (!data.reorderThreshold || data.reorderThreshold <= 0) {
      errors.push('Reorder threshold must be greater than 0');
    }

    if (!data.warehouseLocation?.trim()) {
      errors.push('Warehouse location is required');
    }

    if (!data.description?.trim()) {
      errors.push('Description is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
