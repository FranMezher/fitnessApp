import type { Context, Next } from 'hono';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store — resets on each serverless cold start.
// Good enough for abuse prevention; for stricter limits use Upstash Redis.
const store = new Map<string, RateLimitRecord>();

export function rateLimit(maxPerHour: number) {
  return async (c: Context, next: Next) => {
    const userId: string | undefined = c.get('userId') ?? c.get('user')?.id;
    if (!userId) return next();

    const key = `${c.req.path}:${userId}`;
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;

    let record = store.get(key);
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + hourMs };
    }

    record.count++;
    store.set(key, record);

    if (record.count > maxPerHour) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfterSec));
      return c.json({ error: 'Rate limit exceeded. Try again later.' }, 429);
    }

    await next();
  };
}
