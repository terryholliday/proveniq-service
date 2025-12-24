import { z } from "zod";
export declare const CustodyStateEnum: z.ZodEnum<["OFFERED_FOR_PICKUP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "DISPUTED", "CLOSED"]>;
export declare const CustodyTokenSchema: z.ZodObject<{
    schema_version: z.ZodLiteral<"1.0.0">;
    created_at: z.ZodString;
    correlation_id: z.ZodString;
    idempotency_key: z.ZodString;
} & {
    custody_token_id: z.ZodString;
    asset_id: z.ZodString;
    current_custodian_wallet_id: z.ZodString;
    state: z.ZodEnum<["OFFERED_FOR_PICKUP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "DISPUTED", "CLOSED"]>;
    last_transition_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
    asset_id: string;
    custody_token_id: string;
    current_custodian_wallet_id: string;
    state: "OFFERED_FOR_PICKUP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "DISPUTED" | "CLOSED";
    last_transition_at: string;
}, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
    asset_id: string;
    custody_token_id: string;
    current_custodian_wallet_id: string;
    state: "OFFERED_FOR_PICKUP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "DISPUTED" | "CLOSED";
    last_transition_at: string;
}>;
export type CustodyTokenWire = z.infer<typeof CustodyTokenSchema>;
export declare const HandoffChallengeSchema: z.ZodObject<{
    schema_version: z.ZodLiteral<"1.0.0">;
    created_at: z.ZodString;
    correlation_id: z.ZodString;
    idempotency_key: z.ZodString;
} & {
    challenge_id: z.ZodString;
    custody_token_id: z.ZodString;
    from_wallet_id: z.ZodString;
    to_wallet_id: z.ZodString;
    expires_at: z.ZodString;
    nonce: z.ZodString;
    geo_snapshot: z.ZodOptional<z.ZodObject<{
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
    condition_snapshot: z.ZodDefault<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        sha256: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        sha256: string;
    }, {
        url: string;
        sha256: string;
    }>, "many">>;
    from_signature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
    custody_token_id: string;
    challenge_id: string;
    from_wallet_id: string;
    to_wallet_id: string;
    expires_at: string;
    nonce: string;
    condition_snapshot: {
        url: string;
        sha256: string;
    }[];
    from_signature: string;
    geo_snapshot?: {
        lat_e7: number;
        lon_e7: number;
        geohash: string;
    } | undefined;
}, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
    custody_token_id: string;
    challenge_id: string;
    from_wallet_id: string;
    to_wallet_id: string;
    expires_at: string;
    nonce: string;
    from_signature: string;
    geo_snapshot?: {
        lat_e7: number;
        lon_e7: number;
        geohash: string;
    } | undefined;
    condition_snapshot?: {
        url: string;
        sha256: string;
    }[] | undefined;
}>;
export type HandoffChallengeWire = z.infer<typeof HandoffChallengeSchema>;
export declare const HandoffAcceptanceSchema: z.ZodObject<{
    schema_version: z.ZodLiteral<"1.0.0">;
    created_at: z.ZodString;
    correlation_id: z.ZodString;
    idempotency_key: z.ZodString;
} & {
    acceptance_id: z.ZodString;
    challenge_id: z.ZodString;
    to_wallet_id: z.ZodString;
    accepted_at: z.ZodString;
    to_signature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
    challenge_id: string;
    to_wallet_id: string;
    acceptance_id: string;
    accepted_at: string;
    to_signature: string;
}, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
    challenge_id: string;
    to_wallet_id: string;
    acceptance_id: string;
    accepted_at: string;
    to_signature: string;
}>;
export type HandoffAcceptanceWire = z.infer<typeof HandoffAcceptanceSchema>;
export declare const DeliveryReceiptSchema: z.ZodObject<{
    schema_version: z.ZodLiteral<"1.0.0">;
    created_at: z.ZodString;
    correlation_id: z.ZodString;
    idempotency_key: z.ZodString;
} & {
    custody_token_id: z.ZodString;
    buyer_wallet_id: z.ZodString;
    delivered_at: z.ZodString;
    geo_snapshot: z.ZodOptional<z.ZodObject<{
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
    condition_snapshot: z.ZodDefault<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        sha256: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        sha256: string;
    }, {
        url: string;
        sha256: string;
    }>, "many">>;
    buyer_signature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
    custody_token_id: string;
    condition_snapshot: {
        url: string;
        sha256: string;
    }[];
    buyer_wallet_id: string;
    delivered_at: string;
    buyer_signature: string;
    geo_snapshot?: {
        lat_e7: number;
        lon_e7: number;
        geohash: string;
    } | undefined;
}, {
    schema_version: "1.0.0";
    created_at: string;
    correlation_id: string;
    idempotency_key: string;
    custody_token_id: string;
    buyer_wallet_id: string;
    delivered_at: string;
    buyer_signature: string;
    geo_snapshot?: {
        lat_e7: number;
        lon_e7: number;
        geohash: string;
    } | undefined;
    condition_snapshot?: {
        url: string;
        sha256: string;
    }[] | undefined;
}>;
export type DeliveryReceiptWire = z.infer<typeof DeliveryReceiptSchema>;
