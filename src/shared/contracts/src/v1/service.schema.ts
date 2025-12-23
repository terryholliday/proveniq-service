import { z } from "zod";
import { BaseEventSchema, GeoSnapshotSchema, IntStringSchema } from "./common.schema";

export const ServiceDomainEnum = z.enum(["AUTOMOTIVE", "RESIDENTIAL", "MARINE", "AVIATION"]);

export const ServiceRecordSchema = BaseEventSchema.extend({
    asset_id: z.string().uuid(),
    service_domain: ServiceDomainEnum,                // REQUIRED for license mapping
    provider_id: z.string().min(16),                  // public key fingerprint (format enforced later)
    service_type: z.enum(["MAINTENANCE", "REPAIR", "UPGRADE", "INSPECTION"]),
    description: z.string().max(1000),
    occurred_at: z.string().datetime(),
    meter_type: z.enum(["ODOMETER_MILES", "HOURS", "NONE"]),
    meter_value_int: z.number().int().nullable(),     // safe as int32-ish; if you need >2^53, switch to IntString
    parts_list: z.array(z.object({
        name: z.string().min(1),
        part_sku: z.string().optional(),
        qty_int: z.number().int().min(1),
        unit_cost_micros: IntStringSchema.optional(),   // FLOAT-FREE
        currency: z.string().length(3).optional(),
    })).default([]),
    labor_minutes_int: z.number().int().min(0).optional(),
    attachments: z.array(z.object({
        kind: z.enum(["PHOTO", "PDF", "INVOICE", "OTHER"]),
        url: z.string().url(),
        sha256: z.string().regex(/^[a-f0-9]{64}$/i),
    })).default([]),
    geo: GeoSnapshotSchema.optional(),
    provider_signature: z.string().regex(/^[a-f0-9]+$/i), // hex string
});

export type ServiceRecordWire = z.infer<typeof ServiceRecordSchema>;
