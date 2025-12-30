
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { z } from "zod";
import { requireFirebaseActor } from "@/lib/auth/requireFirebaseActor";

const CompleteWorkOrderSchema = z.object({
  provider_id: z.string(),
  summary: z.string().min(10),
  photo_urls: z.array(z.string()).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Next.js 15 async params
) {
  try {
    const actor = await requireFirebaseActor(req);
    const { id } = await params;
    const body = await req.json();
    const input = CompleteWorkOrderSchema.parse(body);

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }
    if (workOrder.requestorId !== actor.firebase_uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (workOrder.status === "COMPLETED") {
      return NextResponse.json({ error: "Already completed" }, { status: 400 });
    }

    // Update DB
    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: "COMPLETED",
        actualEnd: new Date(),
        workNotes: input.summary,
      },
    });

    // Write SERVICE_WORK_COMPLETED to Ledger
    try {
      const ledgerUrl = process.env.LEDGER_API_URL || "http://localhost:8006/api/v1";

      const payload = {
        work_order_id: workOrder.id,
        summary: input.summary,
        provider_id: input.provider_id
      };

      await fetch(`${ledgerUrl}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "service",
          event_type: "SERVICE_WORK_COMPLETED",
          asset_id: workOrder.assetId,
          anchor_id: workOrder.anchorId ?? undefined,
          correlation_id: crypto.randomUUID(),
          idempotency_key: `wo-complete-${workOrder.id}`,
          occurred_at: new Date().toISOString(),
          schema_version: "1.0.0",
          payload
        }),
      });

    } catch (ledgerError) {
      console.error("Ledger write failed:", ledgerError);
    }

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      completed_at: updated.actualEnd,
    });

  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    if (e?.status === 401) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to complete work order" }, { status: 500 });
  }
}
