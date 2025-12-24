import { z } from "zod";
export declare const ServiceDomainEnum: z.ZodEnum<["AUTOMOTIVE", "RESIDENTIAL", "MARINE", "AVIATION"]>;
export declare const ServiceRecordSchema: z.ZodObject<{
    schema_version: z.ZodLiteral<"1.0.0">;
    created_at: z.ZodString;
    correlation_id: z.ZodString;
    idempotency_key: z.ZodString;
} & {
    asset_id: z.ZodString;
    service_domain: z.ZodEnum<["AUTOMOTIVE", "RESIDENTIAL", "MARINE", "AVIATION"]>;
    provider_id: z.ZodString;
    service_type: z.ZodEnum<["MAINTENANCE", "REPAIR", "UPGRADE", "INSPECTION"]>;
    description: z.ZodString;
    occurred_at: z.ZodString;
    meter_type: z.ZodEnum<["ODOMETER_MILES", "HOURS", "NONE"]>;
    meter_value_int: z.ZodNullable<z.ZodNumber>;
    parts_list: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        part_sku: z.ZodOptional<z.ZodString>;
        qty_int: z.ZodNumber;
        unit_cost_micros: z.ZodOptional<z.ZodString>;
        currency: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        qty_int: number;
        currency?: string | undefined;
        part_sku?: string | undefined;
        unit_cost_micros?: string | undefined;
    }, {
        name: string;
        qty_int: number;
        currency?: string | undefined;
        part_sku?: string | undefined;
        unit_cost_micros?: string | undefined;
    }>, "many">>;
    labor_minutes_int: z.ZodOptional<z.ZodNumber>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<["PHOTO", "PDF", "INVOICE", "OTHER"]>;
        url: z.ZodString;
        sha256: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        kind: "PHOTO" | "PDF" | "INVOICE" | "OTHER";
        url: string;
        sha256: string;
    }, {
        kind: "PHOTO" | "PDF" | "INVOICE" | "OTHER";
        url: string;
        sha256: string;
    }>, "many">>;
    geo: z.ZodOptional<z.ZodObject<{
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
    }>>;
    provider_signature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
    asset_id: string;
    service_domain: "AUTOMOTIVE" | "RESIDENTIAL" | "MARINE" | "AVIATION";
    provider_id: string;
    service_type: "MAINTENANCE" | "REPAIR" | "UPGRADE" | "INSPECTION";
    description: string;
    occurred_at: string;
    meter_type: "ODOMETER_MILES" | "HOURS" | "NONE";
    meter_value_int: number | null;
    parts_list: {
        name: string;
        qty_int: number;
        currency?: string | undefined;
        part_sku?: string | undefined;
        unit_cost_micros?: string | undefined;
    }[];
    attachments: {
        kind: "PHOTO" | "PDF" | "INVOICE" | "OTHER";
        url: string;
        sha256: string;
    }[];
    provider_signature: string;
    labor_minutes_int?: number | undefined;
    geo?: {
        lat_e7: number;
        lon_e7: number;
        geohash: string;
    } | undefined;
}, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
    asset_id: string;
    service_domain: "AUTOMOTIVE" | "RESIDENTIAL" | "MARINE" | "AVIATION";
    provider_id: string;
    service_type: "MAINTENANCE" | "REPAIR" | "UPGRADE" | "INSPECTION";
    description: string;
    occurred_at: string;
    meter_type: "ODOMETER_MILES" | "HOURS" | "NONE";
    meter_value_int: number | null;
    provider_signature: string;
    parts_list?: {
        name: string;
        qty_int: number;
        currency?: string | undefined;
        part_sku?: string | undefined;
        unit_cost_micros?: string | undefined;
    }[] | undefined;
    labor_minutes_int?: number | undefined;
    attachments?: {
        kind: "PHOTO" | "PDF" | "INVOICE" | "OTHER";
        url: string;
        sha256: string;
    }[] | undefined;
    geo?: {
        lat_e7: number;
        lon_e7: number;
        geohash: string;
    } | undefined;
}>;
export type ServiceRecordWire = z.infer<typeof ServiceRecordSchema>;
