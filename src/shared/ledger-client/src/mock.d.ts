import { ILedgerClient, LedgerEvent, LedgerAppendReceipt } from "./types";
export declare class MockLedgerClient implements ILedgerClient {
    private events;
    appendEvent(event: LedgerEvent): Promise<LedgerAppendReceipt>;
    getEventStream(asset_id: string): Promise<LedgerEvent[]>;
}
