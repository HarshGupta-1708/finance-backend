import Redis from 'ioredis';

// Only create Redis client if explicitly needed
const shouldInitializeRedis = process.env.RATE_LIMIT_USE_REDIS === 'true' || 
  (process.env.NODE_ENV === 'production' && Boolean(process.env.REDIS_URL));

export const redis: Redis | null = shouldInitializeRedis 
  ? new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('⚠️  Redis: Max retries exceeded, giving up on this connection');
          return null;
        }
        return Math.min(times * 50, 2000);
      },
    })
  : null;

if (redis) {
  redis.on('error', (err) => {
    console.warn('⚠️  Redis connection error (rate limiting falls back to memory):', err.message);
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected for rate limiting');
  });
}
