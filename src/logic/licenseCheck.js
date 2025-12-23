"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProviderLicense = validateProviderLicense;
const LICENSE_MATRIX = {
    AUTOMOTIVE: {
        MAINTENANCE: ["ASE_CERTIFIED", "ASE_MASTER", "OEM_CERTIFIED"],
        REPAIR: ["ASE_MASTER", "OEM_CERTIFIED"],
        UPGRADE: ["ASE_MASTER", "OEM_CERTIFIED"],
        INSPECTION: ["STATE_INSPECTOR", "ASE_CERTIFIED"],
    },
    RESIDENTIAL: {
        MAINTENANCE: ["LICENSED_HANDYMAN", "LICENSED_PLUMBER", "LICENSED_ELECTRICIAN"],
        REPAIR: ["LICENSED_PLUMBER", "LICENSED_ELECTRICIAN", "GC_LICENSE"],
        UPGRADE: ["GC_LICENSE", "LICENSED_ELECTRICIAN"],
        INSPECTION: ["GC_LICENSE"],
    },
    MARINE: {
        MAINTENANCE: ["MARINE_TECH_CERT"],
        REPAIR: ["MARINE_TECH_CERT"],
        UPGRADE: ["MARINE_TECH_CERT"],
        INSPECTION: ["MARINE_INSPECTOR"],
    },
    AVIATION: {
        MAINTENANCE: ["A_AND_P"],
        REPAIR: ["A_AND_P"],
        UPGRADE: ["A_AND_P", "IA"],
        INSPECTION: ["IA"],
    },
};
function validateProviderLicense(domain, serviceType, providerLicenses) {
    const domainRules = LICENSE_MATRIX[domain];
    if (!domainRules)
        return false;
    const allowed = domainRules[serviceType];
    if (!allowed)
        return false;
    return providerLicenses.some((lic) => allowed.includes(lic));
}
