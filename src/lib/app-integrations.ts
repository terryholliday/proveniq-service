/**
 * @file lib/app-integrations.ts
 * @description PROVENIQ Service - Cross-App Integration Layer
 * 
 * Connects Service with:
 * - Properties: Landlord maintenance requests
 * - Home: Consumer service requests
 * - Ops: Equipment service requests
 * - Core: Work order events via Event Bus
 */

// ============================================
// TYPES
// ============================================

export interface ServiceRequest {
  requestId: string;
  sourceApp: 'properties' | 'home' | 'ops';
  sourceEntityId: string; // Property ID, User ID, or Location ID
  
  // Asset info
  assetId?: string;
  assetPaid?: string;
  assetCategory: string;
  assetDescription: string;
  
  // Service details
  serviceType: 'repair' | 'maintenance' | 'installation' | 'inspection';
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  description: string;
  preferredDate?: string;
  
  // Location
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  
  // Contact
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  
  // Status
  status: 'pending' | 'matched' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface ProviderMatch {
  providerId: string;
  providerName: string;
  matchScore: number;
  estimatedCostCents: number;
  estimatedArrival: string;
  rating: number;
  reviewCount: number;
  licenseVerified: boolean;
  insured: boolean;
}

export interface ServiceCompletion {
  requestId: string;
  providerId: string;
  completedAt: string;
  workPerformed: string;
  partsCostCents: number;
  laborCostCents: number;
  totalCostCents: number;
  warrantyDays: number;
  photos: string[];
  customerSignature?: string;
}

// ============================================
// APP-SPECIFIC CLIENTS
// ============================================

const PROPERTIES_API = process.env.PROPERTIES_API_URL || 'http://localhost:8001';
const HOME_API = process.env.HOME_API_URL || 'http://localhost:9003';
const OPS_API = process.env.OPS_API_URL || 'http://localhost:8002';
const CORE_API = process.env.CORE_API_URL || 'http://localhost:8000';

// ============================================
// IN-MEMORY STORE
// ============================================

const serviceRequests: Map<string, ServiceRequest> = new Map();

// ============================================
// INTEGRATION SERVICE
// ============================================

class AppIntegrationService {
  /**
   * Receive service request from Properties (landlord maintenance)
   */
  async receiveFromProperties(
    propertyId: string,
    unitId: string,
    maintenanceRequest: {
      issueType: string;
      description: string;
      urgency: string;
      reportedBy: 'tenant' | 'landlord';
      photos?: string[];
    }
  ): Promise<ServiceRequest> {
    const requestId = `SVC-PROP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Fetch property details from Properties API
    let propertyDetails = { address: { line1: '', city: '', state: '', zip: '' }, contactName: '', contactPhone: '', contactEmail: '' };
    try {
      const res = await fetch(`${PROPERTIES_API}/api/properties/${propertyId}/units/${unitId}`);
      if (res.ok) {
        propertyDetails = await res.json();
      }
    } catch (e) {
      console.warn('[Integration] Could not fetch property details');
    }

    const request: ServiceRequest = {
      requestId,
      sourceApp: 'properties',
      sourceEntityId: propertyId,
      assetCategory: maintenanceRequest.issueType,
      assetDescription: maintenanceRequest.description,
      serviceType: 'repair',
      urgency: maintenanceRequest.urgency as ServiceRequest['urgency'],
      description: maintenanceRequest.description,
      address: propertyDetails.address || { line1: 'Unknown', city: 'Unknown', state: 'XX', zip: '00000' },
      contactName: propertyDetails.contactName || 'Property Manager',
      contactPhone: propertyDetails.contactPhone || '',
      contactEmail: propertyDetails.contactEmail || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    serviceRequests.set(requestId, request);
    
    // Publish event to Core Event Bus
    await this.publishEvent('service.request_received', request);

    console.log(`[Integration] Properties request: ${requestId} for property ${propertyId}`);
    
    return request;
  }

  /**
   * Receive service request from Home (consumer)
   */
  async receiveFromHome(
    userId: string,
    assetId: string,
    serviceRequest: {
      serviceType: string;
      description: string;
      urgency?: string;
      preferredDate?: string;
    }
  ): Promise<ServiceRequest> {
    const requestId = `SVC-HOME-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Fetch asset details from Home/Core
    let assetDetails = { category: 'general', paid: '', name: '' };
    try {
      const res = await fetch(`${CORE_API}/api/v1/registry/${assetId}`);
      if (res.ok) {
        assetDetails = await res.json();
      }
    } catch (e) {
      console.warn('[Integration] Could not fetch asset details');
    }

    const request: ServiceRequest = {
      requestId,
      sourceApp: 'home',
      sourceEntityId: userId,
      assetId,
      assetPaid: assetDetails.paid,
      assetCategory: assetDetails.category || 'general',
      assetDescription: assetDetails.name || serviceRequest.description,
      serviceType: serviceRequest.serviceType as ServiceRequest['serviceType'],
      urgency: (serviceRequest.urgency || 'medium') as ServiceRequest['urgency'],
      description: serviceRequest.description,
      preferredDate: serviceRequest.preferredDate,
      address: { line1: 'User Address', city: 'TBD', state: 'XX', zip: '00000' },
      contactName: 'Home User',
      contactPhone: '',
      contactEmail: '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    serviceRequests.set(requestId, request);
    
    await this.publishEvent('service.request_received', request);

    console.log(`[Integration] Home request: ${requestId} for user ${userId}`);

    return request;
  }

  /**
   * Receive service request from Ops (equipment)
   */
  async receiveFromOps(
    locationId: string,
    equipmentId: string,
    serviceRequest: {
      equipmentType: string;
      issue: string;
      urgency: string;
      vendorPreference?: string;
    }
  ): Promise<ServiceRequest> {
    const requestId = `SVC-OPS-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const request: ServiceRequest = {
      requestId,
      sourceApp: 'ops',
      sourceEntityId: locationId,
      assetId: equipmentId,
      assetCategory: serviceRequest.equipmentType,
      assetDescription: `Equipment: ${serviceRequest.equipmentType}`,
      serviceType: 'repair',
      urgency: serviceRequest.urgency as ServiceRequest['urgency'],
      description: serviceRequest.issue,
      address: { line1: 'Business Location', city: 'TBD', state: 'XX', zip: '00000' },
      contactName: 'Ops Manager',
      contactPhone: '',
      contactEmail: '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    serviceRequests.set(requestId, request);
    
    await this.publishEvent('service.request_received', request);

    console.log(`[Integration] Ops request: ${requestId} for location ${locationId}`);

    return request;
  }

  /**
   * Notify source app of service completion
   */
  async notifyCompletion(completion: ServiceCompletion): Promise<void> {
    const request = serviceRequests.get(completion.requestId);
    if (!request) {
      throw new Error('Service request not found');
    }

    request.status = 'completed';
    request.updatedAt = new Date().toISOString();

    // Notify source app
    switch (request.sourceApp) {
      case 'properties':
        await this.notifyProperties(request, completion);
        break;
      case 'home':
        await this.notifyHome(request, completion);
        break;
      case 'ops':
        await this.notifyOps(request, completion);
        break;
    }

    // Publish completion event
    await this.publishEvent('service.work_completed', { request, completion });

    console.log(`[Integration] Notified ${request.sourceApp} of completion: ${completion.requestId}`);
  }

  private async notifyProperties(request: ServiceRequest, completion: ServiceCompletion): Promise<void> {
    try {
      await fetch(`${PROPERTIES_API}/api/maintenance/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: request.sourceEntityId,
          serviceRequestId: request.requestId,
          completedAt: completion.completedAt,
          workPerformed: completion.workPerformed,
          totalCost: completion.totalCostCents / 100,
          warrantyDays: completion.warrantyDays,
        }),
      });
    } catch (e) {
      console.error('[Integration] Failed to notify Properties:', e);
    }
  }

  private async notifyHome(request: ServiceRequest, completion: ServiceCompletion): Promise<void> {
    try {
      // Update asset service history via Core
      await fetch(`${CORE_API}/api/v1/events/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'service.work_order_completed',
          sourceApp: 'service',
          entityType: 'asset',
          entityId: request.assetId,
          payload: {
            serviceRequestId: request.requestId,
            providerId: completion.providerId,
            workPerformed: completion.workPerformed,
            totalCost: completion.totalCostCents,
            warrantyDays: completion.warrantyDays,
          },
        }),
      });
    } catch (e) {
      console.error('[Integration] Failed to notify Home via Core:', e);
    }
  }

  private async notifyOps(request: ServiceRequest, completion: ServiceCompletion): Promise<void> {
    try {
      await fetch(`${OPS_API}/api/equipment/service-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: request.sourceEntityId,
          equipmentId: request.assetId,
          serviceRequestId: request.requestId,
          completedAt: completion.completedAt,
          nextServiceDate: new Date(Date.now() + completion.warrantyDays * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    } catch (e) {
      console.error('[Integration] Failed to notify Ops:', e);
    }
  }

  /**
   * Publish event to Core Event Bus
   */
  private async publishEvent(eventType: string, payload: any): Promise<void> {
    try {
      await fetch(`${CORE_API}/api/v1/events/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          sourceApp: 'service',
          entityType: 'order',
          entityId: payload.requestId || payload.request?.requestId,
          payload,
        }),
      });
    } catch (e) {
      console.warn('[Integration] Event publish failed:', e);
    }
  }

  /**
   * Get all requests from a specific source app
   */
  async getRequestsBySource(sourceApp: string): Promise<ServiceRequest[]> {
    return Array.from(serviceRequests.values())
      .filter(r => r.sourceApp === sourceApp);
  }

  /**
   * Get request by ID
   */
  async getRequest(requestId: string): Promise<ServiceRequest | null> {
    return serviceRequests.get(requestId) || null;
  }

  /**
   * Get integration stats
   */
  async getStats(): Promise<{
    totalRequests: number;
    bySource: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const requests = Array.from(serviceRequests.values());
    
    const bySource: Record<string, number> = { properties: 0, home: 0, ops: 0 };
    const byStatus: Record<string, number> = {};

    for (const req of requests) {
      bySource[req.sourceApp] = (bySource[req.sourceApp] || 0) + 1;
      byStatus[req.status] = (byStatus[req.status] || 0) + 1;
    }

    return {
      totalRequests: requests.length,
      bySource,
      byStatus,
    };
  }
}

// Singleton
let service: AppIntegrationService | null = null;

export function getAppIntegrationService(): AppIntegrationService {
  if (!service) {
    service = new AppIntegrationService();
  }
  return service;
}
