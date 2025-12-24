import { z } from "zod";
import { BaseEventSchema, GeoSnapshotSchema } from "./common.schema";

export const CustodyStateEnum = z.enum([
    "OFFERED_FOR_PICKUP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "DISPUTED",
    "CLOSED",
]);

export const CustodyTokenSchema = BaseEventSchema.extend({
    custody_token_id: z.string().uuid(),
    asset_id: z.string().uuid(),
    current_custodian_wallet_id: z.string().min(8),
    state: CustodyStateEnum,
    last_transition_at: z.string().datetime(),
});

export type CustodyTokenWire = z.infer<typeof CustodyTokenSchema>;

export const HandoffChallengeSchema = BaseEventSchema.extend({
    challenge_id: z.string().uuid(),
    custody_token_id: z.string().uuid(),
    from_wallet_id: z.string().min(8),
    to_wallet_id: z.string().min(8),
    expires_at: z.string().datetime(),
    nonce: z.string().min(16),
    geo_snapshot: GeoSnapshotSchema.optional(),
    condition_snapshot: z.array(z.object({
        url: z.string().url(),
        sha256: z.string().regex(/^[a-f0-9]{64}$/i),
    })).default([]),
    from_signature: z.string().regex(/^[a-f0-9]+$/i),
});

export type HandoffChallengeWire = z.infer<typeof HandoffChallengeSchema>;

export const HandoffAcceptanceSchema = BaseEventSchema.extend({
    acceptance_id: z.string().uuid(),
    challenge_id: z.string().uuid(),
    to_wallet_id: z.string().min(8),
    accepted_at: z.string().datetime(),
    to_signature: z.string().regex(/^[a-f0-9]+$/i),
});

export type HandoffAcceptanceWire = z.infer<typeof HandoffAcceptanceSchema>;

export const DeliveryReceiptSchema = BaseEventSchema.extend({
    custody_token_id: z.string().uuid(),
    buyer_wallet_id: z.string().min(8),
    delivered_at: z.string().datetime(),
    geo_snapshot: GeoSnapshotSchema.optional(),
    condition_snapshot: z.array(z.object({
        url: z.string().url(),
        sha256: z.string().regex(/^[a-f0-9]{64}$/i),
    })).default([]),
    buyer_signature: z.string().regex(/^[a-f0-9]+$/i),
});

export type DeliveryReceiptWire = z.infer<typeof DeliveryReceiptSchema>;
