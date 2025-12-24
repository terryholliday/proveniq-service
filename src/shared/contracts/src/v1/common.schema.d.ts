import { z } from "zod";
export declare const IntStringSchema: z.ZodString;
export type IntString = z.infer<typeof IntStringSchema>;
export declare const MoneyMicrosSchema: z.ZodObject<{
    amount_micros: z.ZodString;
    currency: z.ZodString;
}, "strip", z.ZodTypeAny, {
    amount_micros: string;
    currency: string;
}, {
    amount_micros: string;
    currency: string;
}>;
export declare const GeoSnapshotSchema: z.ZodObject<{
    lat_e7: z.ZodNumber;
    lon_e7: z.ZodNumber;
    geohash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    lat_e7: number;
    lon_e7: number;
    geohash: string;
}, {
    lat_e7: number;
    lon_e7: number;
    geohash: string;
}>;
export declare const BaseEventSchema: z.ZodObject<{
    schema_version: z.ZodLiteral<"1.0.0">;
    created_at: z.ZodString;
    correlation_id: z.ZodString;
    idempotency_key: z.ZodString;
}, "strip", z.ZodTypeAny, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
}, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
}>;
