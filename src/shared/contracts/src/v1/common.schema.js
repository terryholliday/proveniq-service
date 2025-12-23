"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEventSchema = exports.GeoSnapshotSchema = exports.MoneyMicrosSchema = exports.IntStringSchema = void 0;
const zod_1 = require("zod");
// STRICT: string-encoded integers to prevent IEEE-754 precision loss
exports.IntStringSchema = zod_1.z
    .string()
    .regex(/^-?\d+$/, "Must be an integer string");
exports.MoneyMicrosSchema = zod_1.z.object({
    amount_micros: exports.IntStringSchema, // JSON-safe integer string
    currency: zod_1.z.string().length(3), // ISO 4217
});
exports.GeoSnapshotSchema = zod_1.z.object({
    lat_e7: zod_1.z.number().int(), // e.g., 377749295 for 37.7749295
    lon_e7: zod_1.z.number().int(),
    geohash: zod_1.z.string().min(1),
});
exports.BaseEventSchema = zod_1.z.object({
    schema_version: zod_1.z.literal("1.0.0"),
    created_at: zod_1.z.string().datetime(),
    correlation_id: zod_1.z.string().uuid(),
    idempotency_key: zod_1.z.string().min(10),
});
