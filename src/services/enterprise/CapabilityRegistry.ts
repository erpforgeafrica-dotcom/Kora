/**
 * Domain-Driven Capability Registry
 * 
 * Instead of hardcoding checks like `if (merchant.type === 'Salon')`,
 * merchants are assigned granular capabilities. This allows cross-pollinating
 * features (e.g. adding video sessions to yoga, or retail products to clinics).
 */

export type KoraCapability =
  | 'telemedicine_video'
  | 'clinical_prescriptions'
  | 'physical_inventory'
  | 'staff_scheduling'
  | 'room_booking'
  | 'equipment_allocation'
  | 'loyalty_rewards'
  | 'staff_commissions'
  | 'payout_ledger';

export interface MerchantCapabilityProfile {
  merchantId: string;
  name: string;
  capabilities: KoraCapability[];
}

const CAPABILITY_REGISTRY: Record<string, KoraCapability[]> = {
  'lagos-lifestyle-node': [
    'physical_inventory',
    'staff_scheduling',
    'room_booking',
    'loyalty_rewards',
    'staff_commissions',
    'payout_ledger'
  ],
  'lagos-health-node': [
    'telemedicine_video',
    'clinical_prescriptions',
    'physical_inventory',
    'staff_scheduling',
    'room_booking',
    'equipment_allocation',
    'payout_ledger'
  ]
};

export class CapabilityRegistry {
  /**
   * Evaluates if a given merchant has the active rights to initiate an operation.
   */
  public static hasCapability(merchantId: string, capability: KoraCapability): boolean {
    const list = CAPABILITY_REGISTRY[merchantId];
    if (!list) return false;
    return list.includes(capability);
  }

  /**
   * Registers or updates a merchant's capability grid.
   */
  public static grantCapability(merchantId: string, capability: KoraCapability): void {
    if (!CAPABILITY_REGISTRY[merchantId]) {
      CAPABILITY_REGISTRY[merchantId] = [];
    }
    if (!CAPABILITY_REGISTRY[merchantId].includes(capability)) {
      CAPABILITY_REGISTRY[merchantId].push(capability);
    }
  }

  /**
   * Retrieves active capability sets for a specific node.
   */
  public static getCapabilities(merchantId: string): KoraCapability[] {
    return CAPABILITY_REGISTRY[merchantId] || [];
  }
}
