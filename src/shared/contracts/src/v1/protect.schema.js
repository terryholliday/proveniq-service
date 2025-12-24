"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyBindRequestSchema = exports.QuoteResponseSchema = exports.QuoteRequestSchema = exports.PricingContextWireSchema = exports.SecurityLevelEnum = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
exports.SecurityLevelEnum = zod_1.z.enum(["LOW", "MED", "HIGH", "VERIFIED"]);
exports.PricingContextWireSchema = common_schema_1.BaseEventSchema.extend({
    asset_id: zod_1.z.string().uuid(),
    asset_valuation_micros: common_schema_1.IntStringSchema, // string integer
    security_level: exports.SecurityLevelEnum,
    last_verified_service_days: zod_1.z.number().int().min(0),
    transit_damage_history: zod_1.z.boolean(),
});
exports.QuoteRequestSchema = common_schema_1.BaseEventSchema.extend({
    asset_id: zod_1.z.string().uuid(),
    coverage_type: zod_1.z.enum(["THEFT", "DAMAGE", "FULL"]),
    term_days: zod_1.z.number().int().min(1).max(3650),
});
exports.QuoteResponseSchema = zod_1.z.object({
    quote_id: zod_1.z.string().uuid(),
    premium_micros: common_schema_1.IntStringSchema,
    currency: zod_1.z.string().length(3),
    pricing_version: zod_1.z.string().min(1),
    inputs_snapshot_hash: zod_1.z.string().regex(/^[a-f0-9]{64}$/i),
    risk_bps: zod_1.z.number().int().min(0),
    reasons: zod_1.z.array(zod_1.z.string()),
    expires_at: zod_1.z.string().datetime(),
});
exports.PolicyBindRequestSchema = common_schema_1.BaseEventSchema.extend({
    quote_id: zod_1.z.string().uuid(),
    payment_token: zod_1.z.string().optional(),
});
