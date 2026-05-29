import { randomUUID } from 'node:crypto';
import type { InventoryItem, VendorOption } from './contracts';

const PROPERTY_1 = '00000000-0000-0000-0000-000000000001';
const PROPERTY_2 = '00000000-0000-0000-0000-000000000002';
const PROPERTY_3 = '00000000-0000-0000-0000-000000000003';

function seedItems(): InventoryItem[] {
  const item = (data: Omit<InventoryItem, 'id'>): InventoryItem => ({ id: randomUUID(), ...data });
  return [
    item({ propertyId: PROPERTY_1, sku: 'TWL-BATH', name: 'Bath Towels', category: 'linen', unit: 'each', onHand: 24, parLevel: 40, baseDailyUsage: 1.5 }),
    item({ propertyId: PROPERTY_1, sku: 'COF-POD', name: 'Coffee Pods', category: 'minibar', unit: 'pod', onHand: 60, parLevel: 80, baseDailyUsage: 4 }),
    item({ propertyId: PROPERTY_1, sku: 'SOAP-BAR', name: 'Soap Bars', category: 'amenities', unit: 'each', onHand: 120, parLevel: 60, baseDailyUsage: 2 }),
    item({ propertyId: PROPERTY_2, sku: 'TWL-BATH', name: 'Bath Towels', category: 'linen', unit: 'each', onHand: 10, parLevel: 36, baseDailyUsage: 1.8 }),
    item({ propertyId: PROPERTY_2, sku: 'TP-ROLL', name: 'Toilet Paper', category: 'consumables', unit: 'roll', onHand: 30, parLevel: 50, baseDailyUsage: 2.5 }),
    item({ propertyId: PROPERTY_3, sku: 'CLN-MULTI', name: 'Multi-surface Cleaner', category: 'cleaning', unit: 'bottle', onHand: 8, parLevel: 12, baseDailyUsage: 0.4 })
  ];
}

function seedVendors(): VendorOption[] {
  const vendor = (data: Omit<VendorOption, 'id'>): VendorOption => ({ id: randomUUID(), ...data });
  return [
    vendor({ name: 'BulkSupply Co', skus: ['TWL-BATH', 'TP-ROLL', 'SOAP-BAR'], unitPrice: 4.2, leadTimeDays: 4, reliability: 0.82 }),
    vendor({ name: 'RapidRestock', skus: ['TWL-BATH', 'COF-POD', 'TP-ROLL'], unitPrice: 5.6, leadTimeDays: 1, reliability: 0.91 }),
    vendor({ name: 'ValueHospitality', skus: ['SOAP-BAR', 'COF-POD', 'CLN-MULTI'], unitPrice: 3.1, leadTimeDays: 7, reliability: 0.74 }),
    vendor({ name: 'PrimeAmenities', skus: ['TWL-BATH', 'SOAP-BAR', 'COF-POD', 'CLN-MULTI'], unitPrice: 4.8, leadTimeDays: 3, reliability: 0.88 })
  ];
}

// Per-property budget for the current operational cycle.
const BUDGETS: Record<string, number> = {
  [PROPERTY_1]: 400,
  [PROPERTY_2]: 250,
  [PROPERTY_3]: 120
};

export class InventoryRepository {
  private readonly items: InventoryItem[] = seedItems();
  private readonly vendors: VendorOption[] = seedVendors();

  listItems(propertyId?: string): InventoryItem[] {
    return this.items.filter((item) => (propertyId ? item.propertyId === propertyId : true));
  }

  findItem(id: string): InventoryItem | undefined {
    return this.items.find((item) => item.id === id);
  }

  /** Vendors able to fulfil a given SKU. */
  vendorsForSku(sku: string): VendorOption[] {
    return this.vendors.filter((vendor) => vendor.skus.includes(sku));
  }

  findVendor(id: string): VendorOption | undefined {
    return this.vendors.find((vendor) => vendor.id === id);
  }

  adjustOnHand(itemId: string, delta: number): InventoryItem | undefined {
    const item = this.findItem(itemId);
    if (!item) return undefined;
    item.onHand = Math.max(0, item.onHand + delta);
    return item;
  }

  budgetFor(propertyId: string): number {
    return BUDGETS[propertyId] ?? 0;
  }
}
