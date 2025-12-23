import { NextRequest, NextResponse } from "next/server";
import { PolicyBindRequestSchema } from "@/shared/contracts/src";
import { ledger } from "@/app/api/_shared/ledger";
import { getQuoteRecord } from "@/app/api/_shared/quoteStore";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = PolicyBindRequestSchema.parse(body);

        const record = getQuoteRecord(parsed.quote_id);
        if (!record) {
            return NextResponse.json({ error: "QUOTE_NOT_FOUND" }, { status: 404 });
        }

        const event = {
            type: "POLICY_BOUND" as const,
            asset_id: record.asset_id,
            payload: {
                request: parsed,
                quote: record.quote,
            },
            correlation_id: parsed.correlation_id,
            idempotency_key: parsed.idempotency_key,
            created_at: parsed.created_at,
            schema_version: parsed.schema_version,
        };

        const receipt = await ledger.appendEvent(event);

        return NextResponse.json({
            policy_id: crypto.randomUUID(),
            quote_id: parsed.quote_id,
            ledger_receipt: receipt,
        }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: "VALIDATION_OR_SYSTEM_ERROR", details: e?.message ?? String(e) }, { status: 400 });
    }
}
