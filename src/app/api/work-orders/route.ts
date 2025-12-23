import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import prisma from "@/lib/db";
import { validateProviderLicense } from "@/logic/licenseCheck";

const CreateWorkOrderSchema = z.object({
  requestor_type: z.string(), // properties, home, ops
  requestor_id: z.string(),
  requestor_ref: z.string().optional(),
  asset_id: z.string(),
  asset_type: z.string(),
  asset_description: z.string().optional(),
  anchor_id: z.string().optional(),
  service_address: z.string().optional(),
  service_city: z.string().optional(),
  service_state: z.string().optional(),
  service_zip: z.string().optional(),
  service_geo: z.object({
    lat: z.number(),
    lon: z.number(),
  }).optional(),
  service_domain: z.string(), // AUTOMOTIVE, RESIDENTIAL, etc.
  service_type: z.string(),   // MAINTENANCE, REPAIR, etc.
  description: z.string(),
  urgency: z.enum(["LOW", "NORMAL", "HIGH", "EMERGENCY"]).default("NORMAL"),
  preferred_dates: z.array(z.string()).optional(),
  provider_id: z.string().optional(), // Pre-assign if known
});

function generateWorkOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `WO-${year}${month}${day}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = CreateWorkOrderSchema.parse(body);

    // If provider specified, verify license
    let provider = null;
    if (input.provider_id) {
      provider = await prisma.provider.findFirst({
        where: { providerId: input.provider_id, status: "ACTIVE" },
        include: { licenses: { where: { verified: true } } },
      });

      if (!provider) {
        return NextResponse.json({ error: "Provider not found or inactive" }, { status: 404 });
      }

      const licenseTypes = provider.licenses.map((l) => l.licenseType);
      if (!validateProviderLicense(input.service_domain, input.service_type, licenseTypes)) {
        return NextResponse.json({ 
          error: "Provider not licensed for this service",
          required_domain: input.service_domain,
          required_type: input.service_type,
        }, { status: 400 });
      }
    }

    const workOrder = await prisma.workOrder.create({
      data: {
        workOrderNumber: generateWorkOrderNumber(),
        requestorType: input.requestor_type,
        requestorId: input.requestor_id,
        requestorRef: input.requestor_ref,
        assetId: input.asset_id,
        assetType: input.asset_type,
        assetDescription: input.asset_description,
        anchorId: input.anchor_id,
        serviceAddress: input.service_address,
        serviceCity: input.service_city,
        serviceState: input.service_state,
        serviceZip: input.service_zip,
        serviceGeo: input.service_geo,
        serviceDomain: input.service_domain,
        serviceType: input.service_type,
        description: input.description,
        urgency: input.urgency,
        preferredDates: input.preferred_dates,
        providerId: provider?.id,
        status: provider ? "ASSIGNED" : "PENDING_ASSIGNMENT",
        assignedAt: provider ? new Date() : null,
      },
    });

    // Create event
    await prisma.workOrderEvent.create({
      data: {
        workOrderId: workOrder.id,
        eventType: "CREATED",
        description: "Work order created",
        actorId: input.requestor_id,
        actorType: "requestor",
        payload: { service_domain: input.service_domain, service_type: input.service_type },
      },
    });

    // Write to Ledger
    try {
      const ledgerUrl = process.env.LEDGER_API_URL || "http://localhost:8006/api/v1";
      await fetch(`${ledgerUrl}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "service",
          event_type: "SERVICE_WORK_ORDER_CREATED",
          asset_id: input.asset_id,
          anchor_id: input.anchor_id,
          correlation_id: crypto.randomUUID(),
          payload: {
            work_order_id: workOrder.id,
            work_order_number: workOrder.workOrderNumber,
            service_domain: input.service_domain,
            service_type: input.service_type,
            requestor_type: input.requestor_type,
            requestor_id: input.requestor_id,
          },
        }),
      });
    } catch (ledgerError) {
      console.error("Ledger write failed:", ledgerError);
    }

    await prisma.auditLog.create({
      data: {
        action: "WORK_ORDER_CREATED",
        resourceType: "work_order",
        resourceId: workOrder.id,
        actorId: input.requestor_id,
        details: {
          work_order_number: workOrder.workOrderNumber,
          service_domain: input.service_domain,
          service_type: input.service_type,
        },
      },
    });

    return NextResponse.json({
      id: workOrder.id,
      work_order_number: workOrder.workOrderNumber,
      status: workOrder.status,
      service_domain: workOrder.serviceDomain,
      service_type: workOrder.serviceType,
      provider_id: provider?.providerId,
      created_at: workOrder.createdAt.toISOString(),
    }, { status: 201 });

  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.issues }, { status: 400 });
    }
    console.error("Work order creation error:", e);
    return NextResponse.json({ error: "Failed to create work order" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const providerId = searchParams.get("provider_id");
    const requestorId = searchParams.get("requestor_id");
    const assetId = searchParams.get("asset_id");

    const where: any = {};
    if (status) where.status = status;
    if (requestorId) where.requestorId = requestorId;
    if (assetId) where.assetId = assetId;
    if (providerId) {
      const provider = await prisma.provider.findFirst({ where: { providerId } });
      if (provider) where.providerId = provider.id;
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        provider: { select: { providerId: true, businessName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      work_orders: workOrders.map((wo) => ({
        id: wo.id,
        work_order_number: wo.workOrderNumber,
        status: wo.status,
        service_domain: wo.serviceDomain,
        service_type: wo.serviceType,
        urgency: wo.urgency,
        asset_id: wo.assetId,
        provider: wo.provider ? {
          provider_id: wo.provider.providerId,
          business_name: wo.provider.businessName,
        } : null,
        scheduled_start: wo.scheduledStart?.toISOString(),
        created_at: wo.createdAt.toISOString(),
      })),
      total: workOrders.length,
    });
  } catch (e: any) {
    console.error("List work orders error:", e);
    return NextResponse.json({ error: "Failed to list work orders" }, { status: 500 });
  }
}
