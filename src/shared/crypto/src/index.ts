import crypto from "crypto";
import stringify from "json-stable-stringify";

// 1) Canonicalize (JSON-safe determinism)
export function canonicalize(obj: unknown): string {
    if (obj === undefined) return "";
    return stringify(obj) || "";
}

// 2) Strip signature fields (prevents circular verification failure)
export function stripSig<T extends Record<string, any>>(
    obj: T,
    sigKeys: string[] = ["provider_signature", "from_signature", "to_signature", "buyer_signature"]
): Omit<T, string> {
    const copy: any = { ...obj };
    for (const k of sigKeys) delete copy[k];
    return copy;
}

// 3) Ed25519 Sign (sign canonical bytes)
export function signEd25519(privateKeyPem: string, canonicalString: string): string {
    const signature = crypto.sign(null, Buffer.from(canonicalString, "utf8"), privateKeyPem);
    return signature.toString("hex");
}

// 4) Ed25519 Verify
export function verifyEd25519(publicKeyPem: string, canonicalString: string, signatureHex: string): boolean {
    return crypto.verify(
        null,
        Buffer.from(canonicalString, "utf8"),
        publicKeyPem,
        Buffer.from(signatureHex, "hex")
    );
}

// 5) SHA-256 Hash (receipts / content addressing)
export function hash256Hex(canonicalString: string): string {
    return crypto.createHash("sha256").update(canonicalString, "utf8").digest("hex");
}
