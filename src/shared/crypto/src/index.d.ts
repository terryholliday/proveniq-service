export declare function canonicalize(obj: unknown): string;
export declare function stripSig<T extends Record<string, any>>(obj: T, sigKeys?: string[]): Omit<T, string>;
export declare function signEd25519(privateKeyPem: string, canonicalString: string): string;
export declare function verifyEd25519(publicKeyPem: string, canonicalString: string, signatureHex: string): boolean;
export declare function hash256Hex(canonicalString: string): string;
