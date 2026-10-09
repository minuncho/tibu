// Identity for the Toss in-app version (tibu-toss). There is no login there: the mini app
// asks the Toss SDK for a one-time code, this server swaps it for the user's anonymous key
// over mutual TLS, and from then on the mini app sends a session token we signed ourselves.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import https from "node:https";
import { TOSS_DEV_ANON, TOSS_MTLS_CERT, TOSS_MTLS_KEY, TOSS_SESSION_SECRET } from "./env";
import { PublicError } from "./http";

const SESSION_DAYS = 30;

export const tossEnabled = Boolean(TOSS_SESSION_SECRET && ((TOSS_MTLS_CERT && TOSS_MTLS_KEY) || TOSS_DEV_ANON));

// Swaps a one-time code from User.createAnonymousKeyAuthCode() for the anonymous key.
// The key is the same for one person in this mini app, across devices and reinstalls.
export function exchangeAnonCode(code: string): Promise<string> {
  // Local development without a certificate: the mock SDK's code stands in for the key.
  if (TOSS_DEV_ANON && !(TOSS_MTLS_CERT && TOSS_MTLS_KEY)) return Promise.resolve(`dev-${code}`);

  const body = JSON.stringify({ code });
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: "apps-in-toss-api.toss.im",
        path: "/api-partner/v1/apps-in-toss/users/anon-key/exchange",
        method: "POST",
        cert: TOSS_MTLS_CERT,
        key: TOSS_MTLS_KEY,
        headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body) },
        timeout: 10_000,
      },
      (res) => {
        let text = "";
        res.on("data", (chunk) => (text += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(text);
            const anonKey = data?.success?.anonKey;
            if (data?.resultType === "SUCCESS" && typeof anonKey === "string") resolve(anonKey);
            // 4011: the code was already used, expired, or belongs to another app
            else if (data?.error?.errorCode === "4011" || data?.error?.errorCode === 4011) {
              reject(new PublicError("다시 시도해 주세요."));
            } else reject(new Error(`Toss anon-key exchange failed: ${text.slice(0, 200)}`));
          } catch {
            reject(new Error(`Toss anon-key exchange: unreadable response (${res.statusCode})`));
          }
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("Toss anon-key exchange timed out")));
    req.on("error", reject);
    req.end(body);
  });
}

// A stable user id derived from the anonymous key, in UUID form so it fits auth.users.
export function tossUserId(anonKey: string) {
  const hex = createHash("sha256").update(`toss:${anonKey}`).digest("hex");
  // version 5 / RFC variant bits, so it is a well-formed UUID
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function sign(payload: string) {
  return createHmac("sha256", TOSS_SESSION_SECRET).update(payload).digest("base64url");
}

export function createTossSession(userId: string) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

// Returns the user id if the token is ours and not expired.
export function readTossSession(token: string): string | null {
  if (!TOSS_SESSION_SECRET) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof uid === "string" && typeof exp === "number" && exp > Date.now() ? uid : null;
  } catch {
    return null;
  }
}
