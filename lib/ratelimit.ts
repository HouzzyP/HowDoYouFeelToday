import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Gracefully degrades if Upstash env vars are not set (e.g. local dev without Redis).
// In that case, all requests pass through — rate limiting is a no-op.
function makeRatelimiter() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        return null;
    }

    const redis = new Redis({ url, token });

    // 3 votes per IP per day (sliding window)
    return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '24 h'),
        prefix: 'hdf_vote',
        analytics: false,
    });
}

export const voteRatelimit = makeRatelimiter();
