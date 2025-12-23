import { z } from "zod";

// STRICT: string-encoded integers to prevent IEEE-754 precision loss
export const IntStringSchema = z
    .string()
    .regex(/^-?\d+$/, "Must be an integer string");

export type IntString = z.infer<typeof IntStringSchema>;

export const MoneyMicrosSchema = z.object({
    amount_micros: IntStringSchema,     // JSON-safe integer string
    currency: z.string().length(3),     // ISO 4217
});

export const GeoSnapshotSchema = z.object({
    lat_e7: z.number().int(),           // e.g., 377749295 for 37.7749295
    lon_e7: z.number().int(),
    geohash: z.string().min(1),
});

export const BaseEventSchema = z.object({
    schema_version: z.literal("1.0.0"),
    created_at: z.string().datetime(),
    correlation_id: z.string().uuid(),
    idempotency_key: z.string().min(10),
});
