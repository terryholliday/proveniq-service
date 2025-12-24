export interface Provider {
    publicKeyPem: string;
    status: "ACTIVE" | "EXPIRED" | "REVOKED" | "PENDING";
    licenses: string[];
}
export declare class ProviderRegistry {
    static get(provider_id: string): Promise<Provider | null>;
}
