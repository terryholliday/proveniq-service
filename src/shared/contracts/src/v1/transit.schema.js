"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryReceiptSchema = exports.HandoffAcceptanceSchema = exports.HandoffChallengeSchema = exports.CustodyTokenSchema = exports.CustodyStateEnum = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
exports.CustodyStateEnum = zod_1.z.enum([
    "OFFERED_FOR_PICKUP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "DISPUTED",
    "CLOSED",
]);
exports.CustodyTokenSchema = common_schema_1.BaseEventSchema.extend({
    custody_token_id: zod_1.z.string().uuid(),
    asset_id: zod_1.z.string().uuid(),
    current_custodian_wallet_id: zod_1.z.string().min(8),
    state: exports.CustodyStateEnum,
    last_transition_at: zod_1.z.string().datetime(),
});
exports.HandoffChallengeSchema = common_schema_1.BaseEventSchema.extend({
    challenge_id: zod_1.z.string().uuid(),
    custody_token_id: zod_1.z.string().uuid(),
    from_wallet_id: zod_1.z.string().min(8),
    to_wallet_id: zod_1.z.string().min(8),
    expires_at: zod_1.z.string().datetime(),
    nonce: zod_1.z.string().min(16),
    geo_snapshot: common_schema_1.GeoSnapshotSchema.optional(),
    condition_snapshot: zod_1.z.array(zod_1.z.object({
        url: zod_1.z.string().url(),
        sha256: zod_1.z.string().regex(/^[a-f0-9]{64}$/i),
    })).default([]),
    from_signature: zod_1.z.string().regex(/^[a-f0-9]+$/i),
});
exports.HandoffAcceptanceSchema = common_schema_1.BaseEventSchema.extend({
    acceptance_id: zod_1.z.string().uuid(),
    challenge_id: zod_1.z.string().uuid(),
    to_wallet_id: zod_1.z.string().min(8),
    accepted_at: zod_1.z.string().datetime(),
    to_signature: zod_1.z.string().regex(/^[a-f0-9]+$/i),
});
exports.DeliveryReceiptSchema = common_schema_1.BaseEventSchema.extend({
    custody_token_id: zod_1.z.string().uuid(),
    buyer_wallet_id: zod_1.z.string().min(8),
    delivered_at: zod_1.z.string().datetime(),
    geo_snapshot: common_schema_1.GeoSnapshotSchema.optional(),
    condition_snapshot: zod_1.z.array(zod_1.z.object({
        url: zod_1.z.string().url(),
        sha256: zod_1.z.string().regex(/^[a-f0-9]{64}$/i),
    })).default([]),
    buyer_signature: zod_1.z.string().regex(/^[a-f0-9]+$/i),
});
