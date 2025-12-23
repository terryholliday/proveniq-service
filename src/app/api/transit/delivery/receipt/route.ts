import { NextRequest, NextResponse } from "next/server";
import { DeliveryReceiptSchema } from "@/shared/contracts/src";
import { ledger } from "@/app/api/_shared/ledger";
import { getAssetIdForCustodyToken } from "@/app/api/_shared/transitStore";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = DeliveryReceiptSchema.parse(body);

        const asset_id = getAssetIdForCustodyToken(parsed.custody_token_id);
        if (!asset_id) {
            return NextResponse.json({ error: "CUSTODY_TOKEN_NOT_FOUND" }, { status: 404 });
        }

        const event = {
            type: "TRANSIT_DELIVERY_RECORDED" as const,
            asset_id,
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
