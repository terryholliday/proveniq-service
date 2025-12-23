import { NextRequest, NextResponse } from "next/server";
import { PricingContextWireSchema } from "@/shared/contracts/src";
import { ledger } from "@/app/api/_shared/ledger";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = PricingContextWireSchema.parse(body);

        const event = {
            type: "PROTECT_PRICING_CONTEXT_RECORDED" as const,
            asset_id: parsed.asset_id,
            payload: parsed,
            correlation_id: parsed.correlation_id,
            idempotency_key: parsed.idempotency_key,
            created_at: parsed.created_at,
            schema_version: parsed.schema_version,
        };

        const receipt = await ledger.appendEvent(event);

        return NextResponse.json({
            pricing_context_id: crypto.randomUUID(),
            ledger_receipt: receipt,
        }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: "VALIDATION_OR_SYSTEM_ERROR", details: e?.message ?? String(e) }, { status: 400 });
    }
}
