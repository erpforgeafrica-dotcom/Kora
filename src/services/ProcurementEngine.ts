/**
 * Closed-Loop Automated Procurement Engine
 * 
 * Maps item counts in realtime, triggering automated purchase requests to supplier pools
 * whenever item levels hit defined safety guidelines.
 */

export interface InventoryItem {
  id: string;
  merchantId: string;
  name: string;
  sku: string;
  currentStock: number;
  safetyThreshold: number;
  reorderQuantity: number;
  preferredVendor: string;
  emoji: string;
}

export interface PurchaseOrder {
  id: string;
  merchantId: string;
  itemId: string;
  itemName: string;
  vendor: string;
  quantityRequested: number;
  status: 'Draft' | 'Dispatched' | 'Delivered';
  createdAt: string;
}

// Global In-Memory Stores
export const INVENTORY_STORE: InventoryItem[] = [
  {
    id: 'prod-01',
    merchantId: 'lagos-lifestyle-node',
    name: 'Organic Scalp Moisturizing Treatment Oil',
    sku: 'SKU-SCALP-OIL-01',
    currentStock: 12,
    safetyThreshold: 15, // Threshold triggered!
    reorderQuantity: 60,
    preferredVendor: 'Lagos Care Suppliers Ltd',
    emoji: '🧴'
  },
  {
    id: 'prod-02',
    merchantId: 'lagos-lifestyle-node',
    name: 'Antiseptic Post-Surgical Swabs (Sterile)',
    sku: 'SKU-SWAB-MED-99',
    currentStock: 45,
    safetyThreshold: 10,
    reorderQuantity: 100,
    preferredVendor: 'Lagos Medical Supplies Hub',
    emoji: '🩺'
  }
];

export const PURCHASE_ORDERS_STORE: PurchaseOrder[] = [];

export class ProcurementEngine {
  /**
   * Performs an instant stock levels validation sweep.
   * Dispatches automated supply replenishments wherever counts violate guidelines.
   */
  public static executeSweep(merchantId: string): { processedCount: number; ordersAdded: PurchaseOrder[] } {
    const ordersAdded: PurchaseOrder[] = [];
    
    // Filter by merchant stock items
    const lowStockItems = INVENTORY_STORE.filter(item => 
      item.merchantId === merchantId && 
      item.currentStock <= item.safetyThreshold
    );

    lowStockItems.forEach(item => {
      // Check if an order is already pending for this item so we avoid duplication
      const alreadyOrdered = PURCHASE_ORDERS_STORE.some(po => 
        po.itemId === item.id && 
        po.status !== 'Delivered'
      );

      if (!alreadyOrdered) {
        const newPO: PurchaseOrder = {
          id: `po-${Math.floor(100 + Math.random() * 900)}`,
          merchantId: item.merchantId,
          itemId: item.id,
          itemName: item.name,
          vendor: item.preferredVendor,
          quantityRequested: item.reorderQuantity,
          status: 'Dispatched',
          createdAt: new Date().toISOString()
        };

        PURCHASE_ORDERS_STORE.push(newPO);
        ordersAdded.push(newPO);

        // Simulate immediate stock arrival after triggering (or keep as dispatched for simulation)
        // For direct preview feel, we can increment inventory simulation or keep it pending
      }
    });

    return {
      processedCount: ordersAdded.length,
      ordersAdded
    };
  }

  /**
   * Refuels inventory manually to demonstrate successful replenishment delivery.
   */
  public static deliverOrder(poId: string): { success: boolean; message: string } {
    const poIdx = PURCHASE_ORDERS_STORE.findIndex(p => p.id === poId);
    if (poIdx === -1) {
      return { success: false, message: "Purchase Order records not found." };
    }

    const po = PURCHASE_ORDERS_STORE[poIdx];
    if (po.status === 'Delivered') {
      return { success: false, message: "This purchase shipment has already been checked into inventory." };
    }

    // Deliver PO, increment corresponding stock
    po.status = 'Delivered';
    const item = INVENTORY_STORE.find(i => i.id === po.itemId);
    if (item) {
      item.currentStock += po.quantityRequested;
    }

    return {
      success: true,
      message: `Checked in ${po.quantityRequested} units of ${po.itemName} into inventory records.`
    };
  }
}
