// Lightweight memory rate limiter for dev/demo
// Limits: 60 requests per IP per 1 minute

const WINDOW_MS = 60 * 1000;
const MAX_REQ = 60;
const buckets = new Map();

module.exports = function rateLimiter() {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(ip) || { count: 0, reset: now + WINDOW_MS };

    if (now > bucket.reset) {
      bucket.count = 0;
      bucket.reset = now + WINDOW_MS;
    }
    bucket.count += 1;
    buckets.set(ip, bucket);

    res.set('X-RateLimit-Limit', String(MAX_REQ));
    res.set('X-RateLimit-Remaining', String(Math.max(0, MAX_REQ - bucket.count)));
    res.set('X-RateLimit-Reset', String(Math.floor(bucket.reset / 1000)));

    if (bucket.count > MAX_REQ) {
      return res.status(429).json({ error: 'Too Many Requests' });
    }
    next();
  };
};
