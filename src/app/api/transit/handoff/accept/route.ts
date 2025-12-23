import { NextRequest, NextResponse } from "next/server";
import { HandoffAcceptanceSchema } from "@/shared/contracts/src";
import { ledger } from "@/app/api/_shared/ledger";
import { getAssetIdForCustodyToken, getCustodyTokenForChallenge } from "@/app/api/_shared/transitStore";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = HandoffAcceptanceSchema.parse(body);

        const custody_token_id = getCustodyTokenForChallenge(parsed.challenge_id);
        if (!custody_token_id) {
            return NextResponse.json({ error: "CHALLENGE_NOT_FOUND" }, { status: 404 });
        }

        const asset_id = getAssetIdForCustodyToken(custody_token_id);
        if (!asset_id) {
            return NextResponse.json({ error: "CUSTODY_TOKEN_NOT_FOUND" }, { status: 404 });
        }

        const event = {
            type: "TRANSIT_HANDOFF_COMPLETED" as const,
            asset_id,
            custody_token_id,
            payload: parsed,
            correlation_id: parsed.correlation_id,
            idempotency_key: parsed.idempotency_key,
            created_at: parsed.created_at,
            schema_version: parsed.schema_version,
        };

        const receipt = await ledger.appendEvent(event);

        return NextResponse.json({
            acceptance_id: parsed.acceptance_id,
            custody_token_id,
            ledger_receipt: receipt,
        }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: "VALIDATION_OR_SYSTEM_ERROR", details: e?.message ?? String(e) }, { status: 400 });
    }
}
