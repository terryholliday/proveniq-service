import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import prisma from "@/lib/db";

const CompleteWorkOrderSchema = z.object({
  provider_id: z.string(),
  labor_cents: z.number().int(),
  parts_cents: z.number().int().default(0),
  parts_used: z.array(z.object({
    name: z.string(),
    quantity: z.number().int(),
    cost_cents: z.number().int(),
  })).optional(),
  work_notes: z.string().optional(),
  after_evidence: z.array(z.object({
    url: z.string().url(),
    type: z.string(),
    description: z.string().optional(),
  })).optional(),
  warranty_days: z.number().int().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const input = CompleteWorkOrderSchema.parse(body);

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { provider: true },
    });

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }

    if (!workOrder.provider || workOrder.provider.providerId !== input.provider_id) {
      return NextResponse.json({ error: "Only assigned provider can complete" }, { status: 403 });
    }

    if (!["ASSIGNED", "SCHEDULED", "IN_PROGRESS"].includes(workOrder.status)) {
      return NextResponse.json({ error: `Cannot complete work order in ${workOrder.status} status` }, { status: 400 });
    }

    const finalCostCents = input.labor_cents + input.parts_cents;

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: "PENDING_APPROVAL",
        actualEnd: new Date(),
        laborCents: input.labor_cents,
        partsCents: input.parts_cents,
        finalCostCents,
        partsUsed: input.parts_used,
        workNotes: input.work_notes,
        afterEvidence: input.after_evidence,
      },
    });

    await prisma.workOrderEvent.create({
      data: {
        workOrderId: id,
        eventType: "WORK_COMPLETED",
        description: "Work completed, pending approval",
        actorId: input.provider_id,
        actorType: "provider",
        payload: {
          labor_cents: input.labor_cents,
          parts_cents: input.parts_cents,
          final_cost_cents: finalCostCents,
          parts_count: input.parts_used?.length || 0,
          evidence_count: input.after_evidence?.length || 0,
        },
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
          event_type: "SERVICE_WORK_COMPLETED",
          asset_id: workOrder.assetId,
          anchor_id: workOrder.anchorId,
          actor_id: input.provider_id,
          correlation_id: crypto.randomUUID(),
          payload: {
            work_order_id: workOrder.id,
            work_order_number: workOrder.workOrderNumber,
            provider_id: input.provider_id,
            labor_cents: input.labor_cents,
            parts_cents: input.parts_cents,
            final_cost_cents: finalCostCents,
            warranty_days: input.warranty_days,
            evidence_hashes: input.after_evidence?.map((e) => e.url) || [],
          },
        }),
      });
    } catch (ledgerError) {
      console.error("Ledger write failed:", ledgerError);
    }

    // Update provider stats
    await prisma.provider.update({
      where: { id: workOrder.provider.id },
      data: { completedJobs: { increment: 1 } },
    });

    await prisma.auditLog.create({
      data: {
        action: "WORK_ORDER_COMPLETED",
        resourceType: "work_order",
        resourceId: workOrder.id,
        actorId: input.provider_id,
        details: {
          work_order_number: workOrder.workOrderNumber,
          final_cost_cents: finalCostCents,
        },
      },
    });

    return NextResponse.json({
      id: updated.id,
      work_order_number: updated.workOrderNumber,
      status: updated.status,
      final_cost_cents: finalCostCents,
      labor_cents: input.labor_cents,
      parts_cents: input.parts_cents,
      completed_at: updated.actualEnd?.toISOString(),
    });

  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.issues }, { status: 400 });
    }
    console.error("Complete work order error:", e);
    return NextResponse.json({ error: "Failed to complete work order" }, { status: 500 });
  }
}
