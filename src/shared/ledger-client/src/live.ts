import { ILedgerClient, LedgerEvent, LedgerAppendReceipt } from "./types";

const DEFAULT_API_URL = "http://localhost:3002/v1/ledger";

interface LedgerApiResponse {
    success: boolean;
    data?: {
        event: {
            eventId: string;
            timestamp: string;
        };
        chainPosition: number;
        hash: string;
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

export class LiveLedgerClient implements ILedgerClient {
    private apiUrl: string;

    constructor(apiUrl?: string) {
        this.apiUrl = apiUrl || process.env.LEDGER_API_URL || DEFAULT_API_URL;
    }

    async appendEvent(event: LedgerEvent): Promise<LedgerAppendReceipt> {
        // Map ILedgerClient event to backend API format
        const payload = {
            itemId: event.asset_id,
            // WalletID is required by backend but may not be applicable for Service events.
            // Using a system constant or deriving from context if possible. 
            // For Service, we use 'SERVICE_AUTHORITY' or provider_id if available in payload.
            walletId: (event.payload as any).provider_id || "SERVICE_SYSTEM",
            eventType: event.type,
            payload: event.payload,
            idempotencyKey: event.idempotency_key,
        };

        try {
            const response = await fetch(`${this.apiUrl}/events`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(event.idempotency_key ? { "X-Idempotency-Key": event.idempotency_key } : {}),
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ledger API HTTP ${response.status}: ${errorText}`);
            }

            const json = (await response.json()) as LedgerApiResponse;

            if (!json.success || !json.data) {
                throw new Error(`Ledger API Error: ${json.error?.message || "Unknown error"}`);
            }

            return {
                ledger_event_id: json.data.event.eventId,
                committed_at: json.data.event.timestamp,
                monotonic_index: json.data.chainPosition.toString(),
                canonical_hash_hex: json.data.hash,
            };
        } catch (error: any) {
            console.error("LiveLedgerClient Error:", error);
            throw new Error(`Failed to append to ledger: ${error.message}`);
        }
    }

    async getEventStream(asset_id: string): Promise<LedgerEvent[]> {
        // Not strictly required for the write-path verification, but good to have stubs.
        throw new Error("Method not implemented.");
    }
}
