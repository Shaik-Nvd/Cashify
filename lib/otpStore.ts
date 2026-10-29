import crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || 'sstelecom-secret-key-32characters-minimum-secure';

export function generateOtpToken(phone: string, code: string, ttlMs: number = 5 * 60 * 1000): string {
  const expiresAt = Date.now() + ttlMs;
  const payload = `${phone}:${code}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  const tokenData = JSON.stringify({ phone, code, expiresAt, sig: hmac });
  return Buffer.from(tokenData).toString('base64url');
}

export function verifyOtpToken(phone: string, code: string, token: string): boolean {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const data = JSON.parse(raw);
    if (!data || data.phone !== phone || data.code !== code) {
      return false;
    }
    if (Date.now() > data.expiresAt) {
      return false;
    }
    const payload = `${phone}:${code}:${data.expiresAt}`;
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(data.sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

// In-memory fallback for local dev server
export const otps = new Map<string, { code: string; expiresAt: number; attempts: number }>();
