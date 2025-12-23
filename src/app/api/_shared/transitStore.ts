type CustodyRecord = {
    asset_id: string;
};

type ChallengeRecord = {
    custody_token_id: string;
};

const custodyTokens = new Map<string, CustodyRecord>();
const handoffChallenges = new Map<string, ChallengeRecord>();

export function registerCustodyToken(custody_token_id: string, asset_id: string) {
    custodyTokens.set(custody_token_id, { asset_id });
}

export function registerHandoffChallenge(challenge_id: string, custody_token_id: string) {
    handoffChallenges.set(challenge_id, { custody_token_id });
}

export function getAssetIdForCustodyToken(custody_token_id: string) {
    return custodyTokens.get(custody_token_id)?.asset_id ?? null;
}

export function getCustodyTokenForChallenge(challenge_id: string) {
    return handoffChallenges.get(challenge_id)?.custody_token_id ?? null;
}
