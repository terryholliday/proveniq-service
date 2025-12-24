"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canonicalize = canonicalize;
exports.stripSig = stripSig;
exports.signEd25519 = signEd25519;
exports.verifyEd25519 = verifyEd25519;
exports.hash256Hex = hash256Hex;
const crypto_1 = __importDefault(require("crypto"));
const json_stable_stringify_1 = __importDefault(require("json-stable-stringify"));
// 1) Canonicalize (JSON-safe determinism)
function canonicalize(obj) {
    if (obj === undefined)
        return "";
    return (0, json_stable_stringify_1.default)(obj);
}
// 2) Strip signature fields (prevents circular verification failure)
function stripSig(obj, sigKeys = ["provider_signature", "from_signature", "to_signature", "buyer_signature"]) {
    const copy = { ...obj };
    for (const k of sigKeys)
        delete copy[k];
    return copy;
}
// 3) Ed25519 Sign (sign canonical bytes)
function signEd25519(privateKeyPem, canonicalString) {
    const signature = crypto_1.default.sign(null, Buffer.from(canonicalString, "utf8"), privateKeyPem);
    return signature.toString("hex");
}
// 4) Ed25519 Verify
function verifyEd25519(publicKeyPem, canonicalString, signatureHex) {
    return crypto_1.default.verify(null, Buffer.from(canonicalString, "utf8"), publicKeyPem, Buffer.from(signatureHex, "hex"));
}
// 5) SHA-256 Hash (receipts / content addressing)
function hash256Hex(canonicalString) {
    return crypto_1.default.createHash("sha256").update(canonicalString, "utf8").digest("hex");
}
