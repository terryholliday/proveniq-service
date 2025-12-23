import { z } from "zod";
export declare const SecurityLevelEnum: z.ZodEnum<["LOW", "MED", "HIGH", "VERIFIED"]>;
export declare const PricingContextWireSchema: z.ZodObject<{
    schema_version: z.ZodLiteral<"1.0.0">;
    created_at: z.ZodString;
    correlation_id: z.ZodString;
    idempotency_key: z.ZodString;
} & {
    asset_id: z.ZodString;
    asset_valuation_micros: z.ZodString;
    security_level: z.ZodEnum<["LOW", "MED", "HIGH", "VERIFIED"]>;
    last_verified_service_days: z.ZodNumber;
    transit_damage_history: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
    asset_id: string;
    asset_valuation_micros: string;
    security_level: "LOW" | "MED" | "HIGH" | "VERIFIED";
    last_verified_service_days: number;
    transit_damage_history: boolean;
}, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
    asset_id: string;
    asset_valuation_micros: string;
    security_level: "LOW" | "MED" | "HIGH" | "VERIFIED";
    last_verified_service_days: number;
    transit_damage_history: boolean;
}>;
export type PricingContextWire = z.infer<typeof PricingContextWireSchema>;
export declare const QuoteRequestSchema: z.ZodObject<{
    schema_version: z.ZodLiteral<"1.0.0">;
    created_at: z.ZodString;
    correlation_id: z.ZodString;
    idempotency_key: z.ZodString;
} & {
    asset_id: z.ZodString;
    coverage_type: z.ZodEnum<["THEFT", "DAMAGE", "FULL"]>;
    term_days: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
    asset_id: string;
    coverage_type: "THEFT" | "DAMAGE" | "FULL";
    term_days: number;
}, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
    asset_id: string;
    coverage_type: "THEFT" | "DAMAGE" | "FULL";
    term_days: number;
}>;
export type QuoteRequestWire = z.infer<typeof QuoteRequestSchema>;
export declare const QuoteResponseSchema: z.ZodObject<{
    quote_id: z.ZodString;
    premium_micros: z.ZodString;
    currency: z.ZodString;
    pricing_version: z.ZodString;
    inputs_snapshot_hash: z.ZodString;
    risk_bps: z.ZodNumber;
    reasons: z.ZodArray<z.ZodString, "many">;
    expires_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currency: string;
    expires_at: string;
    quote_id: string;
    premium_micros: string;
    pricing_version: string;
    inputs_snapshot_hash: string;
    risk_bps: number;
    reasons: string[];
}, {
    currency: string;
    expires_at: string;
    quote_id: string;
    premium_micros: string;
    pricing_version: string;
    inputs_snapshot_hash: string;
    risk_bps: number;
    reasons: string[];
}>;
export type QuoteResponseWire = z.infer<typeof QuoteResponseSchema>;
export declare const PolicyBindRequestSchema: z.ZodObject<{
    schema_version: z.ZodLiteral<"1.0.0">;
    created_at: z.ZodString;
    correlation_id: z.ZodString;
    idempotency_key: z.ZodString;
} & {
    quote_id: z.ZodString;
    payment_token: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
    quote_id: string;
    payment_token?: string | undefined;
}, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
    quote_id: string;
    payment_token?: string | undefined;
}>;
export type PolicyBindRequestWire = z.infer<typeof PolicyBindRequestSchema>;
