"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderRegistry = void 0;
class ProviderRegistry {
    static async get(provider_id) {
        // In a real implementation, this would query a database
        // For now, return a mock provider if ID matches a specific test ID
        if (provider_id === "provider_mock_123") {
            return {
                publicKeyPem: "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----", // Mock key
                status: "ACTIVE",
                licenses: ["ASE_MASTER"]
            };
        }
        return null;
    }
}
exports.ProviderRegistry = ProviderRegistry;
