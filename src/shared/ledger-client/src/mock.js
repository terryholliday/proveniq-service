"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockLedgerClient = void 0;
const crypto_1 = __importDefault(require("crypto"));
const crypto_2 = require("@proveniq/crypto");
class MockLedgerClient {
    constructor() {
        this.events = [];
    }
    async appendEvent(event) {
        const canonical = (0, crypto_2.canonicalize)(event);
        const hash = (0, crypto_2.hash256Hex)(canonical);
        const receipt = {
            ledger_event_id: crypto_1.default.randomUUID(),
            committed_at: new Date().toISOString(),
            monotonic_index: this.events.length.toString(),
            canonical_hash_hex: hash,
        };
        this.events.push(event);
        return receipt;
    }
    async getEventStream(asset_id) {
        return this.events.filter((e) => e.asset_id === asset_id);
    }
}
exports.MockLedgerClient = MockLedgerClient;
