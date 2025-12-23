import { IntString } from "@proveniq/contracts";
import { ServiceRecordWire } from "@proveniq/contracts";
export type LedgerEvent = {
    type: "SERVICE_RECORDED";
    asset_id: string;
    payload: ServiceRecordWire & {
        canonical_hash_hex: string;
    };
    correlation_id: string;
    idempotency_key: string;
    created_at: string;
    schema_version: "1.0.0";
} | {
    type: "TRANSIT_HANDOFF_COMPLETED";
    asset_id: string;
    custody_token_id: string;
    payload: any;
    correlation_id: string;
    idempotency_key: string;
    created_at: string;
    schema_version: "1.0.0";
} | {
    type: "PROTECT_QUOTE_CREATED";
    asset_id: string;
    payload: any;
    correlation_id: string;
    idempotency_key: string;
    created_at: string;
    schema_version: "1.0.0";
} | {
    type: "POLICY_BOUND";
    asset_id: string;
    payload: any;
    correlation_id: string;
    idempotency_key: string;
    created_at: string;
    schema_version: "1.0.0";
};
export interface LedgerAppendReceipt {
    ledger_event_id: string;
    committed_at: string;
    monotonic_index: IntString;
    canonical_hash_hex: string;
}
export interface ILedgerClient {
    appendEvent(event: LedgerEvent): Promise<LedgerAppendReceipt>;
    getEventStream(asset_id: string): Promise<LedgerEvent[]>;
}
