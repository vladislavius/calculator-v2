import crypto from 'crypto';

// 8-hour session lifetime
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_TOKEN_SECRET env var must be set (min 32 chars)');
  }
  return secret;
}

/**
 * Creates a self-validating session token: `{timestamp}:{nonce}:{hmac_signature}`.
 * No server-side storage needed — the signature proves authenticity.
 */
export function createSessionToken(): string {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const secret = getSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}:${nonce}`)
    .digest('hex');
  return `${timestamp}:${nonce}:${signature}`;
}

/**
 * Returns true only if the token was signed with ADMIN_TOKEN_SECRET and has not expired.
 */
export function validateSessionToken(token: string | null | undefined): boolean {
  if (!token) return false;

  const parts = token.split(':');
  if (parts.length !== 3) return false;

  const [timestamp, nonce, signature] = parts;
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;

  // Reject expired tokens
  if (Date.now() - ts > TOKEN_TTL_MS) return false;

  try {
    const secret = getSecret();
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}:${nonce}`)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(signature);
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}
