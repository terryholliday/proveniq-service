"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRecordSchema = exports.ServiceDomainEnum = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
exports.ServiceDomainEnum = zod_1.z.enum(["AUTOMOTIVE", "RESIDENTIAL", "MARINE", "AVIATION"]);
exports.ServiceRecordSchema = common_schema_1.BaseEventSchema.extend({
    asset_id: zod_1.z.string().uuid(),
    service_domain: exports.ServiceDomainEnum, // REQUIRED for license mapping
    provider_id: zod_1.z.string().min(16), // public key fingerprint (format enforced later)
    service_type: zod_1.z.enum(["MAINTENANCE", "REPAIR", "UPGRADE", "INSPECTION"]),
    description: zod_1.z.string().max(1000),
    occurred_at: zod_1.z.string().datetime(),
    meter_type: zod_1.z.enum(["ODOMETER_MILES", "HOURS", "NONE"]),
    meter_value_int: zod_1.z.number().int().nullable(), // safe as int32-ish; if you need >2^53, switch to IntString
    parts_list: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1),
        part_sku: zod_1.z.string().optional(),
        qty_int: zod_1.z.number().int().min(1),
        unit_cost_micros: common_schema_1.IntStringSchema.optional(), // FLOAT-FREE
        currency: zod_1.z.string().length(3).optional(),
    })).default([]),
    labor_minutes_int: zod_1.z.number().int().min(0).optional(),
    attachments: zod_1.z.array(zod_1.z.object({
        kind: zod_1.z.enum(["PHOTO", "PDF", "INVOICE", "OTHER"]),
        url: zod_1.z.string().url(),
        sha256: zod_1.z.string().regex(/^[a-f0-9]{64}$/i),
    })).default([]),
    geo: common_schema_1.GeoSnapshotSchema.optional(),
    provider_signature: zod_1.z.string().regex(/^[a-f0-9]+$/i), // hex string
});
