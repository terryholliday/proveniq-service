import { NextRequest, NextResponse } from "next/server";
import { CustodyTokenSchema } from "@/shared/contracts/src";
import { ledger } from "@/app/api/_shared/ledger";
import { registerCustodyToken } from "@/app/api/_shared/transitStore";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = CustodyTokenSchema.parse(body);

        registerCustodyToken(parsed.custody_token_id, parsed.asset_id);

        const event = {
            type: "TRANSIT_CUSTODY_TOKEN_ISSUED" as const,
            asset_id: parsed.asset_id,
            custody_token_id: parsed.custody_token_id,
            payload: parsed,
            correlation_id: parsed.correlation_id,
            idempotency_key: parsed.idempotency_key,
            created_at: parsed.created_at,
            schema_version: parsed.schema_version,
        };

        const receipt = await ledger.appendEvent(event);

        return NextResponse.json({
            custody_token_id: parsed.custody_token_id,
            ledger_receipt: receipt,
        }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: "VALIDATION_OR_SYSTEM_ERROR", details: e?.message ?? String(e) }, { status: 400 });
    }
}
