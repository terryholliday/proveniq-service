import crypto from "crypto";
import { ILedgerClient, LedgerEvent, LedgerAppendReceipt } from "./types";
import { canonicalize, hash256Hex } from "@/shared/crypto/src";

export class MockLedgerClient implements ILedgerClient {
    private events: LedgerEvent[] = [];

    async appendEvent(event: LedgerEvent): Promise<LedgerAppendReceipt> {
        const canonical = canonicalize(event);
        const hash = hash256Hex(canonical);

        const receipt: LedgerAppendReceipt = {
            ledger_event_id: crypto.randomUUID(),
            committed_at: new Date().toISOString(),
            monotonic_index: this.events.length.toString(),
            canonical_hash_hex: hash,
        };

        this.events.push(event);
        return receipt;
    }

    async getEventStream(asset_id: string): Promise<LedgerEvent[]> {
        return this.events.filter((e) => (e as any).asset_id === asset_id);
    }
}
