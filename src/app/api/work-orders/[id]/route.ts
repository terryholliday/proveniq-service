import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import prisma from "@/lib/db";
import { requireFirebaseActor } from "@/lib/auth/requireFirebaseActor";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireFirebaseActor(req);
    const { id } = await params;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            providerId: true,
            businessName: true,
            contactEmail: true,
            contactPhone: true,
            rating: true,
          },
        },
        events: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }
    if (workOrder.requestorId !== actor.firebase_uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: workOrder.id,
      work_order_number: workOrder.workOrderNumber,
      status: workOrder.status,
      
      // Requestor
      requestor_type: workOrder.requestorType,
      requestor_id: workOrder.requestorId,
      requestor_ref: workOrder.requestorRef,
      
      // Asset
      asset_id: workOrder.assetId,
      asset_type: workOrder.assetType,
      asset_description: workOrder.assetDescription,
      anchor_id: workOrder.anchorId,
      
      // Service
      service_domain: workOrder.serviceDomain,
      service_type: workOrder.serviceType,
      description: workOrder.description,
      urgency: workOrder.urgency,
      
      // Location
      service_address: workOrder.serviceAddress,
      service_city: workOrder.serviceCity,
      service_state: workOrder.serviceState,
      service_zip: workOrder.serviceZip,
      
      // Provider
      provider: workOrder.provider ? {
        provider_id: workOrder.provider.providerId,
        business_name: workOrder.provider.businessName,
        contact_email: workOrder.provider.contactEmail,
        contact_phone: workOrder.provider.contactPhone,
        rating: workOrder.provider.rating,
      } : null,
      assigned_at: workOrder.assignedAt?.toISOString(),
      
      // Schedule
      scheduled_start: workOrder.scheduledStart?.toISOString(),
      scheduled_end: workOrder.scheduledEnd?.toISOString(),
      actual_start: workOrder.actualStart?.toISOString(),
      actual_end: workOrder.actualEnd?.toISOString(),
      
      // Pricing
      estimated_cents: workOrder.estimatedCents,
      final_cost_cents: workOrder.finalCostCents,
      labor_cents: workOrder.laborCents,
      parts_cents: workOrder.partsCents,
      
      // Evidence
      before_evidence: workOrder.beforeEvidence,
      after_evidence: workOrder.afterEvidence,
      parts_used: workOrder.partsUsed,
      work_notes: workOrder.workNotes,
      
      // Events
      events: workOrder.events.map((e) => ({
        id: e.id,
        type: e.eventType,
        description: e.description,
        actor_id: e.actorId,
        actor_type: e.actorType,
        created_at: e.createdAt.toISOString(),
      })),
      
      created_at: workOrder.createdAt.toISOString(),
      updated_at: workOrder.updatedAt.toISOString(),
    });
  } catch (e: any) {
    if (e?.status === 401) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error("Get work order error:", e);
    return NextResponse.json({ error: "Failed to get work order" }, { status: 500 });
  }
}

const UpdateWorkOrderSchema = z.object({
  status: z.enum([
    "ASSIGNED", "SCHEDULED", "IN_PROGRESS", 
    "PENDING_APPROVAL", "COMPLETED", "CANCELLED"
  ]).optional(),
  provider_id: z.string().optional(),
  scheduled_start: z.string().datetime().optional(),
  scheduled_end: z.string().datetime().optional(),
  estimated_cents: z.number().int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireFirebaseActor(req);
    const { id } = await params;
    const body = await req.json();
    const input = UpdateWorkOrderSchema.parse(body);

    const workOrder = await prisma.workOrder.findUnique({ where: { id } });
    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }
    if (workOrder.requestorId !== actor.firebase_uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    let eventType = "UPDATED";
    let eventDescription = "Work order updated";

    if (input.provider_id) {
      const provider = await prisma.provider.findFirst({
        where: { providerId: input.provider_id, status: "ACTIVE" },
      });
      if (!provider) {
        return NextResponse.json({ error: "Provider not found" }, { status: 404 });
      }
      updateData.providerId = provider.id;
      updateData.assignedAt = new Date();
      updateData.status = "ASSIGNED";
      eventType = "ASSIGNED";
      eventDescription = `Assigned to ${provider.businessName}`;
    }

    if (input.status) {
      updateData.status = input.status;
      eventType = `STATUS_${input.status}`;
      eventDescription = `Status changed to ${input.status}`;

      if (input.status === "IN_PROGRESS") {
        updateData.actualStart = new Date();
      } else if (input.status === "COMPLETED") {
        updateData.actualEnd = new Date();
      }
    }

    if (input.scheduled_start) {
      updateData.scheduledStart = new Date(input.scheduled_start);
      updateData.status = "SCHEDULED";
    }
    if (input.scheduled_end) updateData.scheduledEnd = new Date(input.scheduled_end);
    if (input.estimated_cents) updateData.estimatedCents = input.estimated_cents;

    const updated = await prisma.workOrder.update({
      where: { id },
      data: updateData,
    });

    await prisma.workOrderEvent.create({
      data: {
        workOrderId: id,
        eventType,
        description: eventDescription,
        payload: input,
      },
    });

    return NextResponse.json({
      id: updated.id,
      work_order_number: updated.workOrderNumber,
      status: updated.status,
      updated_at: updated.updatedAt.toISOString(),
    });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.issues }, { status: 400 });
    }
    if (e?.status === 401) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error("Update work order error:", e);
    return NextResponse.json({ error: "Failed to update work order" }, { status: 500 });
  }
}
