import {
    CustodyTokenWire,
    DeliveryReceiptWire,
    HandoffAcceptanceWire,
    HandoffChallengeWire,
    PricingContextWire,
    QuoteRequestWire,
    QuoteResponseWire,
    ServiceRecordWire,
    PolicyBindRequestWire,
} from "@/shared/contracts/src";
import { IntString } from "@/shared/contracts/src";

export type LedgerEvent =
    | {
        type: "SERVICE_RECORDED";
        asset_id: string;
        payload: ServiceRecordWire & { canonical_hash_hex: string };
        correlation_id: string;
        idempotency_key: string;
        created_at: string;
        schema_version: "1.0.0";
    }
    | {
        type: "TRANSIT_CUSTODY_TOKEN_ISSUED";
        asset_id: string;
        custody_token_id: string;
        payload: CustodyTokenWire;
        correlation_id: string;
        idempotency_key: string;
        created_at: string;
        schema_version: "1.0.0";
    }
    | {
        type: "TRANSIT_HANDOFF_CHALLENGED";
        asset_id: string;
        custody_token_id: string;
        payload: HandoffChallengeWire;
        correlation_id: string;
        idempotency_key: string;
        created_at: string;
        schema_version: "1.0.0";
    }
    | {
        type: "TRANSIT_HANDOFF_COMPLETED";
        asset_id: string;
        custody_token_id: string;
        payload: HandoffAcceptanceWire;
        correlation_id: string;
        idempotency_key: string;
        created_at: string;
        schema_version: "1.0.0";
    }
    | {
        type: "TRANSIT_DELIVERY_RECORDED";
        asset_id: string;
        custody_token_id: string;
        payload: DeliveryReceiptWire;
        correlation_id: string;
        idempotency_key: string;
        created_at: string;
        schema_version: "1.0.0";
    }
    | {
        type: "PROTECT_PRICING_CONTEXT_RECORDED";
        asset_id: string;
        payload: PricingContextWire;
        correlation_id: string;
        idempotency_key: string;
        created_at: string;
        schema_version: "1.0.0";
    }
    | {
        type: "PROTECT_QUOTE_CREATED";
        asset_id: string;
        payload: {
            request: QuoteRequestWire;
            response: QuoteResponseWire;
        };
        correlation_id: string;
        idempotency_key: string;
        created_at: string;
        schema_version: "1.0.0";
    }
    | {
        type: "POLICY_BOUND";
        asset_id: string;
        payload: {
            request: PolicyBindRequestWire;
            quote: QuoteResponseWire;
        };
        correlation_id: string;
        idempotency_key: string;
        created_at: string;
        schema_version: "1.0.0";
    };

export interface LedgerAppendReceipt {
    ledger_event_id: string;
    committed_at: string;         // ISO
    monotonic_index: IntString;   // string int
    canonical_hash_hex: string;   // sha256 of canonical event
}

export interface ILedgerClient {
    appendEvent(event: LedgerEvent): Promise<LedgerAppendReceipt>;
    getEventStream(asset_id: string): Promise<LedgerEvent[]>;
}
