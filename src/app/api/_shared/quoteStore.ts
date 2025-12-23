import { QuoteResponseWire } from "@/shared/contracts/src";

type QuoteRecord = {
    asset_id: string;
    quote: QuoteResponseWire;
};

const quotes = new Map<string, QuoteRecord>();

export function registerQuote(quote_id: string, asset_id: string, quote: QuoteResponseWire) {
    quotes.set(quote_id, { asset_id, quote });
}

export function getQuoteRecord(quote_id: string) {
    return quotes.get(quote_id) ?? null;
}
