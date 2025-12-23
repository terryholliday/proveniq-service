
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ServiceRecordSchema } from "@/shared/contracts/src";
import { canonicalize, stripSig, hash256Hex, verifyEd25519 } from "@/shared/crypto/src";
import { MockLedgerClient } from "@/shared/ledger-client/src/mock";
import { validateProviderLicense } from "@/logic/licenseCheck";
// import { ProviderRegistry } from "@/logic/providerRegistry"; // Registry needs adaptation if it's not a simple export

// Stubbing ProviderRegistry locally if needed or importing from adapted logic
import { ProviderRegistry } from "@/logic/providerRegistry";

const ledger = new MockLedgerClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = ServiceRecordSchema.parse(body);

        const provider = await ProviderRegistry.get(parsed.provider_id);
        if (!provider || provider.status !== "ACTIVE") {
            return NextResponse.json({ error: "PROVIDER_INVALID_OR_REVOKED" }, { status: 403 });
        }

        if (!validateProviderLicense(parsed.service_domain, parsed.service_type, provider.licenses)) {
            return NextResponse.json({ error: "PROVIDER_LICENSE_MISMATCH" }, { status: 400 });
        }

        const unsigned = stripSig(parsed, ["provider_signature"]);
        const canonical = canonicalize(unsigned);
        const ok = verifyEd25519(provider.publicKeyPem, canonical, parsed.provider_signature);

        if (!ok) return NextResponse.json({ error: "INVALID_PROVIDER_SIGNATURE" }, { status: 401 });

        const canonical_hash_hex = hash256Hex(canonical);

        const event = {
            type: "SERVICE_RECORDED" as const,
            asset_id: parsed.asset_id,
            payload: { ...parsed, canonical_hash_hex },
            correlation_id: parsed.correlation_id,
            idempotency_key: parsed.idempotency_key,
            created_at: parsed.created_at,
            schema_version: "1.0.0" as const,
        };

        const receipt = await ledger.appendEvent(event);

        return NextResponse.json({
            service_record_id: crypto.randomUUID(),
            ledger_receipt: receipt,
            canonical_hash_hex,
        }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: "VALIDATION_OR_SYSTEM_ERROR", details: e?.message ?? String(e) }, { status: 400 });
    }
}
