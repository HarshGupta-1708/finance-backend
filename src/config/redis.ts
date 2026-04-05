import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  enableOfflineQueue: true,
  maxRetriesPerRequest: 1,
});

redis.on('error', (err) => {
  console.warn('Redis connection error (rate limiting falls back to memory):', err.message);
});
