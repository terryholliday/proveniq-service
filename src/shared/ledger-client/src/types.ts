import { IntString } from "@/shared/contracts/src";
import { ServiceRecordWire } from "@/shared/contracts/src";

// CANONICAL EVENT TYPES (DOMAIN_NOUN_VERB_PAST)
export const SERVICE_EVENT_TYPES = {
    WORKORDER_CREATED: 'SERVICE_WORKORDER_CREATED',
    PROVIDER_ASSIGNED: 'SERVICE_PROVIDER_ASSIGNED',
    PROVIDER_ARRIVED: 'SERVICE_PROVIDER_ARRIVED',
    WORK_COMPLETED: 'SERVICE_WORK_COMPLETED',
    RECORD_CREATED: 'SERVICE_RECORD_CREATED',
    WORKORDER_CANCELLED: 'SERVICE_WORKORDER_CANCELLED',
    RATING_SUBMITTED: 'SERVICE_RATING_SUBMITTED',
} as const;

export type LedgerEvent =
    | {
        type: "SERVICE_RECORD_CREATED";
        asset_id: string;
        payload: ServiceRecordWire & { canonical_hash_hex: string };
        correlation_id: string;
        idempotency_key: string;
        created_at: string;
        schema_version: "1.0.0";
    }
    | {
        type: "SERVICE_WORKORDER_CREATED";
        asset_id: string;
        work_order_id: string;
        payload: any;
        correlation_id: string;
        idempotency_key: string;
        created_at: string;
        schema_version: "1.0.0";
    }
    | {
        type: "SERVICE_WORK_COMPLETED";
        asset_id: string;
        work_order_id: string;
        payload: any;
        correlation_id: string;
        idempotency_key: string;
        created_at: string;
        schema_version: "1.0.0";
    }
    | {
        type: "TRANSIT_SHIPMENT_DELIVERED";
        asset_id: string;
        shipment_id: string;
        payload: any;
        correlation_id: string;
        idempotency_key: string;
        created_at: string;
        schema_version: "1.0.0";
    }
    | {
        type: "PROTECT_POLICY_QUOTED";
        asset_id: string;
        policy_id: string;
        payload: any;
        correlation_id: string;
        idempotency_key: string;
        created_at: string;
        schema_version: "1.0.0";
    }
    | {
        type: "PROTECT_POLICY_BOUND";
        asset_id: string;
        policy_id: string;
        payload: any;
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
