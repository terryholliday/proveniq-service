/**
 * PROVENIQ — Require Firebase Actor (Next.js App Router)
 * Usage inside route handlers:
 *
 *   const actor = await requireFirebaseActor(request);
 *
 * You can then map actor.uid to your internal users table:
 *   users.firebase_uid = actor.uid
 */
import { verifyFirebaseBearerToken } from "./firebaseAdmin";

export type FirebaseActor = {
  firebase_uid: string;
  email?: string;
  claims: Record<string, unknown>;
};

function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export async function requireFirebaseActor(req: Request): Promise<FirebaseActor> {
  const token = getBearerToken(req);
  if (!token) {
    const err = new Error("Missing Authorization Bearer token");
    // @ts-expect-error attach status
    err.status = 401;
    throw err;
  }
  const decoded = await verifyFirebaseBearerToken(token);
  return {
    firebase_uid: decoded.uid,
    email: decoded.email,
    claims: decoded,
  };
}
