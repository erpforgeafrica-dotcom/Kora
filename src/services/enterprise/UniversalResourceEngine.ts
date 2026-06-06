/**
 * Universal Resource Scheduler Engine
 * 
 * Manages scheduling for all bookable resources (Janitors, Doctors, Chairs, Consultation Rooms, Specialized Lasers).
 * Prevents overlapping assignments without knowing the vertical-specific context.
 */

export type ResourceType = 'human_staff' | 'physical_space' | 'hardware_asset';

export interface BookableResource {
  id: string;
  merchantId: string;
  type: ResourceType;
  name: string;
  status: 'active' | 'under_maintenance' | 'inactive';
}

export interface ResourceAssignment {
  id: string;
  merchantId: string;
  resourceId: string;
  startTime: string; // ISO Datetime
  endTime: string;   // ISO Datetime
  purposeId: string; // Map back to appointment/booking reference
}

// Memory repositories
export const RESOURCES_STORE: BookableResource[] = [
  { id: 'res-st-10', merchantId: 'lagos-lifestyle-node', type: 'human_staff', name: 'Jane Doe (Top Stylist)', status: 'active' },
  { id: 'res-ch-11', merchantId: 'lagos-lifestyle-node', type: 'physical_space', name: 'Styling Chair #4', status: 'active' },
  { id: 'res-eq-12', merchantId: 'lagos-lifestyle-node', type: 'hardware_asset', name: 'Dyson Airwrap Styler Pro', status: 'active' },
  
  { id: 'res-dr-20', merchantId: 'lagos-health-node', type: 'human_staff', name: 'Dr. John Okafor (Cardiologist)', status: 'active' },
  { id: 'res-rm-21', merchantId: 'lagos-health-node', type: 'physical_space', name: 'Consultation Suite B', status: 'active' },
  { id: 'res-eq-22', merchantId: 'lagos-health-node', type: 'hardware_asset', name: 'High-Resolution Ultrasound Machine V2', status: 'active' }
];

export const ASSIGNMENTS_STORE: ResourceAssignment[] = [];

export class UniversalResourceEngine {
  /**
   * Evaluates if a collection of required resources is fully collision-free
   * and blocks them for the specified slot time.
   */
  public static bookUnifiedResources(params: {
    merchantId: string;
    resourceIds: string[];
    startTime: string;
    endTime: string;
    purposeId: string;
  }): { success: boolean; message: string; assignmentIds?: string[] } {
    const startVal = new Date(params.startTime).getTime();
    const endVal = new Date(params.endTime).getTime();

    if (isNaN(startVal) || isNaN(endVal) || startVal >= endVal) {
      return { success: false, message: 'Invalid scheduling segment parameters.' };
    }

    // 1. Verify resource existence and readiness
    for (const rid of params.resourceIds) {
      const res = RESOURCES_STORE.find(r => r.id === rid && r.merchantId === params.merchantId);
      if (!res) {
        return { success: false, message: `Resource [${rid}] is not registered under this merchant.` };
      }
      if (res.status !== 'active') {
        return { success: false, message: `Resource [${res.name}] is currently flagged as ${res.status}.` };
      }
    }

    // 2. Scan assignments for scheduling collisions
    for (const rid of params.resourceIds) {
      const conflict = ASSIGNMENTS_STORE.find(asm =>
        asm.resourceId === rid &&
        Math.max(startVal, new Date(asm.startTime).getTime()) < Math.min(endVal, new Date(asm.endTime).getTime())
      );

      if (conflict) {
        const res = RESOURCES_STORE.find(r => r.id === rid);
        return {
          success: false,
          message: `Collision detected: Resource [${res ? res.name : rid}] is already booked for transaction [${conflict.purposeId}].`
        };
      }
    }

    // 3. Commit resource assignments atomically
    const assignmentIds: string[] = [];
    params.resourceIds.forEach(rid => {
      const asmId = `asm-${Math.floor(1000 + Math.random() * 9000)}`;
      ASSIGNMENTS_STORE.push({
        id: asmId,
        merchantId: params.merchantId,
        resourceId: rid,
        startTime: params.startTime,
        endTime: params.endTime,
        purposeId: params.purposeId
      });
      assignmentIds.push(asmId);
    });

    return {
      success: true,
      message: 'All physical, technical, and human resources allocated successfully.',
      assignmentIds
    };
  }

  /**
   * Lists resources dynamically by type
   */
  public static getResources(merchantId: string, type?: ResourceType): BookableResource[] {
    return RESOURCES_STORE.filter(r => r.merchantId === merchantId && (!type || r.type === type));
  }
}
