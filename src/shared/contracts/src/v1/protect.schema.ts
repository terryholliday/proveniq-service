import { z } from "zod";
import { BaseEventSchema, IntStringSchema } from "./common.schema";

export const SecurityLevelEnum = z.enum(["LOW", "MED", "HIGH", "VERIFIED"]);

export const PricingContextWireSchema = BaseEventSchema.extend({
    asset_id: z.string().uuid(),
    asset_valuation_micros: IntStringSchema,     // string integer
    security_level: SecurityLevelEnum,
    last_verified_service_days: z.number().int().min(0),
    transit_damage_history: z.boolean(),
});

export type PricingContextWire = z.infer<typeof PricingContextWireSchema>;

export const QuoteRequestSchema = BaseEventSchema.extend({
    asset_id: z.string().uuid(),
    coverage_type: z.enum(["THEFT", "DAMAGE", "FULL"]),
    term_days: z.number().int().min(1).max(3650),
});

export type QuoteRequestWire = z.infer<typeof QuoteRequestSchema>;

export const QuoteResponseSchema = z.object({
    quote_id: z.string().uuid(),
    premium_micros: IntStringSchema,
    currency: z.string().length(3),
    pricing_version: z.string().min(1),
    inputs_snapshot_hash: z.string().regex(/^[a-f0-9]{64}$/i),
    risk_bps: z.number().int().min(0),
    reasons: z.array(z.string()),
    expires_at: z.string().datetime(),
});

export type QuoteResponseWire = z.infer<typeof QuoteResponseSchema>;

export const PolicyBindRequestSchema = BaseEventSchema.extend({
    quote_id: z.string().uuid(),
    payment_token: z.string().optional(),
});

export type PolicyBindRequestWire = z.infer<typeof PolicyBindRequestSchema>;
