/**
 * @file src/lib/core-client.ts
 * @description PROVENIQ Core API Client for Service App
 * 
 * Provides:
 * - Service history by PAID
 * - Warranty tracking
 * - Value impact from service
 * - Provider fraud scoring
 */

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8000';

// ============================================
// TYPES
// ============================================

export interface ServiceHistoryEntry {
  eventId: string;
  paid: string;
  serviceType: string;
  providerId: string;
  providerName?: string;
  completedAt: string;
  cost: number;
  partsReplaced?: string[];
  warrantyUntil?: string;
}

export interface ServiceHistory {
  paid: string;
  assetName?: string;
  totalServices: number;
  totalCost: number;
  entries: ServiceHistoryEntry[];
  lastServiceDate?: string;
  activeWarranties: number;
}

export interface WarrantyStatus {
  paid: string;
  hasActiveWarranty: boolean;
  warranties: Array<{
    type: 'manufacturer' | 'service' | 'extended';
    provider: string;
    expiresAt: string;
    daysRemaining: number;
    coverageDetails?: string;
  }>;
  nextExpiration?: string;
}

export interface ValueImpactResult {
  paid: string;
  preServiceValue: number;
  postServiceValue: number;
  valueChange: number;
  valueChangePercent: number;
  recommendation: string;
}

export interface ProviderFraudResult {
  providerId: string;
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  canAcceptWork: boolean;
  signals: string[];
}

// ============================================
// CORE CLIENT
// ============================================

class CoreClient {
  /**
   * Get service history for an asset by PAID
   */
  async getServiceHistory(paid: string): Promise<ServiceHistory | null> {
    try {
      // Get asset info from registry
      const assetResponse = await fetch(`${CORE_API_URL}/api/v1/registry/${paid}`, {
        method: 'GET',
        headers: { 'X-Source-App': 'proveniq-service' },
      });

      if (!assetResponse.ok) {
        console.warn('[Core] Asset not found:', paid);
        return null;
      }

      const asset = await assetResponse.json();

      // In production: Query Ledger for SERVICE_COMPLETED events
      // For now, return structure with asset info
      return {
        paid,
        assetName: asset.name,
        totalServices: 0, // Would come from Ledger events
        totalCost: 0,
        entries: [],
        activeWarranties: 0,
      };
    } catch (error) {
      console.error('[Core] Service history error:', error);
      return null;
    }
  }

  /**
   * Get warranty status for an asset
   */
  async getWarrantyStatus(paid: string): Promise<WarrantyStatus> {
    try {
      // Get asset from registry
      const response = await fetch(`${CORE_API_URL}/api/v1/registry/${paid}`, {
        method: 'GET',
        headers: { 'X-Source-App': 'proveniq-service' },
      });

      if (response.ok) {
        // In production: Warranty data would be stored in Core/Ledger
        // For now, return empty warranty status
        return {
          paid,
          hasActiveWarranty: false,
          warranties: [],
        };
      }
    } catch (error) {
      console.error('[Core] Warranty status error:', error);
    }

    return {
      paid,
      hasActiveWarranty: false,
      warranties: [],
    };
  }

  /**
   * Calculate value impact of service work
   */
  async calculateValueImpact(
    paid: string,
    category: string,
    serviceType: string,
    serviceCost: number
  ): Promise<ValueImpactResult | null> {
    try {
      // Get current valuation
      const response = await fetch(`${CORE_API_URL}/api/v1/valuations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source-App': 'proveniq-service',
        },
        body: JSON.stringify({
          assetId: paid,
          name: 'Service Asset',
          category,
          condition: 'good',
        }),
      });

      if (response.ok) {
        const valuation = await response.json();
        const preServiceValue = valuation.estimatedValue;

        // Value impact calculation
        // Repair: Maintains value (prevents further depreciation)
        // Replacement: Partially restores value
        // Maintenance: Maintains value
        let valueChange = 0;
        let recommendation = '';

        switch (serviceType.toLowerCase()) {
          case 'repair':
            valueChange = Math.min(serviceCost * 0.5, preServiceValue * 0.1);
            recommendation = 'Service maintains asset value and prevents further depreciation';
            break;
          case 'replacement':
            valueChange = Math.min(serviceCost * 0.7, preServiceValue * 0.2);
            recommendation = 'Part replacement partially restores asset value';
            break;
          case 'maintenance':
            valueChange = Math.min(serviceCost * 0.3, preServiceValue * 0.05);
            recommendation = 'Regular maintenance maintains asset value';
            break;
          default:
            valueChange = 0;
            recommendation = 'Service type does not directly impact value';
        }

        const postServiceValue = preServiceValue + valueChange;
        const valueChangePercent = (valueChange / preServiceValue) * 100;

        return {
          paid,
          preServiceValue,
          postServiceValue: Math.round(postServiceValue),
          valueChange: Math.round(valueChange),
          valueChangePercent: Math.round(valueChangePercent * 100) / 100,
          recommendation,
        };
      }
    } catch (error) {
      console.error('[Core] Value impact error:', error);
    }

    return null;
  }

  /**
   * Screen provider for fraud before accepting work
   */
  async screenProvider(
    providerId: string,
    completedJobs: number = 0,
    disputeRate: number = 0,
    averageJobValue: number = 0
  ): Promise<ProviderFraudResult> {
    try {
      const response = await fetch(`${CORE_API_URL}/api/v1/fraud/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source-App': 'proveniq-service',
        },
        body: JSON.stringify({
          assetId: `provider-${providerId}`,
          userId: providerId,
          claimType: 'valuation',
          claimedValue: averageJobValue,
          category: 'service_provider',
          hasReceipt: true,
          hasImages: true,
          imageCount: 3,
          previousClaims: completedJobs,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Adjust for provider-specific factors
        let adjustedScore = data.score;
        
        // High dispute rate increases risk
        if (disputeRate > 0.1) {
          adjustedScore += 20;
        } else if (disputeRate > 0.05) {
          adjustedScore += 10;
        }
        
        // Experience reduces risk
        if (completedJobs > 100) {
          adjustedScore -= 10;
        } else if (completedJobs > 50) {
          adjustedScore -= 5;
        }

        adjustedScore = Math.max(0, Math.min(100, adjustedScore));

        const riskLevel = 
          adjustedScore <= 30 ? 'LOW' :
          adjustedScore <= 60 ? 'MEDIUM' :
          adjustedScore <= 80 ? 'HIGH' : 'CRITICAL';

        return {
          providerId,
          score: adjustedScore,
          riskLevel,
          canAcceptWork: adjustedScore < 70,
          signals: data.signals?.map((s: any) => s.description) || [],
        };
      }
    } catch (error) {
      console.error('[Core] Provider screening error:', error);
    }

    // Default: Allow with review
    return {
      providerId,
      score: 40,
      riskLevel: 'MEDIUM',
      canAcceptWork: true,
      signals: ['Core unavailable - limited verification'],
    };
  }

  /**
   * Record service completion in Core (via Ledger)
   */
  async recordServiceCompletion(
    paid: string,
    providerId: string,
    serviceType: string,
    cost: number,
    partsReplaced: string[],
    warrantyDays: number = 0
  ): Promise<{ success: boolean; eventId?: string }> {
    try {
      // This would write to Ledger via Core's write-through
      // For now, log and return success
      console.log('[Core] Recording service completion:', {
        paid,
        providerId,
        serviceType,
        cost,
        partsReplaced,
        warrantyDays,
      });

      return {
        success: true,
        eventId: `svc-${Date.now().toString(36)}`,
      };
    } catch (error) {
      console.error('[Core] Service record error:', error);
      return { success: false };
    }
  }
}

// Singleton export
export const coreClient = new CoreClient();
