import Redis from 'ioredis';

// Only create Redis client if explicitly needed
const shouldInitializeRedis = process.env.RATE_LIMIT_USE_REDIS === 'true' || 
  (process.env.NODE_ENV === 'production' && Boolean(process.env.REDIS_URL));

export const redis: Redis | null = shouldInitializeRedis 
  ? new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      enableOfflineQueue: true,
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        if (times > 10) {
          console.warn('⚠️  Redis: Max retries exceeded (10+), giving up');
          return null;
        }
        return delay;
      },
    })
  : null;

if (redis) {
  redis.on('connect', () => {
    console.log('✅ Redis connected for rate limiting');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
  });
}
