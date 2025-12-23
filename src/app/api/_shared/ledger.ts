import { MockLedgerClient } from "@/shared/ledger-client/src/mock";
import { LiveLedgerClient } from "@/shared/ledger-client/src/live";

const USE_REAL_LEDGER = process.env.USE_REAL_LEDGER === "true";

export const ledger = USE_REAL_LEDGER ? new LiveLedgerClient() : new MockLedgerClient();
