/**
 * CRM, Loyalty & Dynamic Re-engagement Automation Engine
 * 
 * Auto-assesses customer activity, managing loyalty rewards points, card stamps, etc.
 * Scans for lapsed accounts (e.g., clients with no bookings in past 30 days) to issue automated re-engagement coupons.
 */

export interface LoyaltyAccount {
  clientId: string;
  clientName: string;
  email: string;
  stampsCount: number; // Stamp card representation (e.g., 10 stamps = 1 free appointment)
  totalPoints: number;
  lastBookingDate: string; // ISO String
}

export interface CouponCode {
  code: string;
  discountPercentage: number;
  isActive: boolean;
  notes: string;
}

// In-Memory Database Stores
export const LOYALTY_ACCOUNTS: LoyaltyAccount[] = [
  {
    clientId: 'usr-901',
    clientName: 'Funmi Alabi',
    email: 'funmi.alabi@gmail.com',
    stampsCount: 4,
    totalPoints: 340,
    lastBookingDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() // 5 days ago (Active)
  },
  {
    clientId: 'usr-902',
    clientName: 'Obinna Eze',
    email: 'obinna.eze@outlook.com',
    stampsCount: 8,
    totalPoints: 890,
    lastBookingDate: new Date(Date.now() - 36 * 24 * 3600 * 1000).toISOString() // 36 days ago (Lapsed!)
  },
  {
    clientId: 'usr-903',
    clientName: 'Chioma Nze',
    email: 'chioma.nze@yahoo.com',
    stampsCount: 2,
    totalPoints: 120,
    lastBookingDate: new Date(Date.now() - 42 * 24 * 3600 * 1000).toISOString() // 42 days ago (Lapsed!)
  }
];

export const DYNAMIC_COUPONS: CouponCode[] = [
  {
    code: 'KORAFLAIR20',
    discountPercentage: 20,
    isActive: true,
    notes: 'Standard 20% aesthetic welcome pack'
  }
];

export class LoyaltyCRMService {
  /**
   * Fetches all registered accounts
   */
  public static getAccounts(): LoyaltyAccount[] {
    return LOYALTY_ACCOUNTS;
  }

  /**
   * Fetches active re-engagement coupons
   */
  public static getCoupons(): CouponCode[] {
    return DYNAMIC_COUPONS;
  }

  /**
   * Accumulates a stamp upon checkout completion
   */
  public static recordLoyaltyFulfillment(clientId: string): { stamps: number; earnedReward: boolean } {
    const acc = LOYALTY_ACCOUNTS.find(a => a.clientId === clientId);
    if (!acc) return { stamps: 0, earnedReward: false };

    acc.stampsCount += 1;
    acc.totalPoints += 100;
    acc.lastBookingDate = new Date().toISOString();

    let earnedReward = false;
    if (acc.stampsCount >= 10) {
      acc.stampsCount = 0; // Reset card stamps
      earnedReward = true;
      // Inject reward card coupon code
      const rewardCode = `REWARD-${Math.floor(100 + Math.random() * 900)}`;
      DYNAMIC_COUPONS.push({
        code: rewardCode,
        discountPercentage: 100, // 100% Free Service reward
        isActive: true,
        notes: `Reward free ticket issued to ${acc.clientName}`
      });
    }

    return { stamps: acc.stampsCount, earnedReward };
  }

  /**
   * Autonomously scans client ledger for users inactive for > 30 days.
   * Auto-generates customized direct re-engagement promo coupon codes.
   */
  public static scanAndIssueLapsedRetentionCoupons(): { processedRetentionCount: number; matches: string[] } {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
    const matches: string[] = [];

    const lapsedUsers = LOYALTY_ACCOUNTS.filter(a => 
      new Date(a.lastBookingDate).getTime() < thirtyDaysAgo
    );

    lapsedUsers.forEach(user => {
      const code = `WE_MISS_YOU_${user.clientName.split(' ')[0].toUpperCase()}`;
      
      // Keep it unique
      if (!DYNAMIC_COUPONS.some(c => c.code === code)) {
        DYNAMIC_COUPONS.push({
          code,
          discountPercentage: 25, // 25% discount incentive to stimulate re-engagement
          isActive: true,
          notes: `Automatic re-engagement reward for inactive client ${user.clientName}`
        });
        matches.push(user.clientName);
      }
    });

    return {
      processedRetentionCount: matches.length,
      matches
    };
  }
}
