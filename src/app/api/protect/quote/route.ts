import { NextRequest, NextResponse } from "next/server";
import { QuoteRequestSchema, QuoteResponseSchema } from "@/shared/contracts/src";
import { canonicalize, hash256Hex } from "@/shared/crypto/src";
import { ledger } from "@/app/api/_shared/ledger";
import { registerQuote } from "@/app/api/_shared/quoteStore";
import crypto from "crypto";

function buildQuote(request: ReturnType<typeof QuoteRequestSchema.parse>) {
    const basePremiumMicros = 2500000n;
    const termMultiplier = BigInt(request.term_days);
    const premiumMicros = basePremiumMicros * termMultiplier;

    const inputs_snapshot_hash = hash256Hex(canonicalize(request));

    return QuoteResponseSchema.parse({
        quote_id: crypto.randomUUID(),
        premium_micros: premiumMicros.toString(),
        currency: "USD",
        pricing_version: "v1",
        inputs_snapshot_hash,
        risk_bps: 120,
        reasons: ["INITIAL_RISK_MODEL"],
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = QuoteRequestSchema.parse(body);

        const quote = buildQuote(parsed);
        registerQuote(quote.quote_id, parsed.asset_id, quote);

        const event = {
            type: "PROTECT_QUOTE_CREATED" as const,
            asset_id: parsed.asset_id,
            payload: {
                request: parsed,
                response: quote,
            },
            correlation_id: parsed.correlation_id,
            idempotency_key: parsed.idempotency_key,
            created_at: parsed.created_at,
            schema_version: parsed.schema_version,
        };

        const receipt = await ledger.appendEvent(event);

        return NextResponse.json({
            quote,
            ledger_receipt: receipt,
        }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: "VALIDATION_OR_SYSTEM_ERROR", details: e?.message ?? String(e) }, { status: 400 });
    }
}
