import rateLimit from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { redis } from '../config/redis';

const shouldUseRedisStore =
  process.env.RATE_LIMIT_USE_REDIS === 'true' ||
  (process.env.NODE_ENV === 'production' && Boolean(process.env.REDIS_URL));

// Create store once at module initialization
let store: RedisStore | undefined;

if (shouldUseRedisStore && redis) {
  try {
    console.log('✅ Initializing Redis rate limiter store');
    const redisClient = redis; // Capture redis in closure for type safety
    store = new RedisStore({
      sendCommand: async (...args: string[]): Promise<RedisReply> => {
        const [command, ...rest] = args;
        return (await redisClient.call(command, ...rest)) as RedisReply;
      },
      prefix: 'rl:',
    });
  } catch (error) {
    console.warn(
      '⚠️  Failed to initialize Redis rate limiter store, falling back to memory store:',
      error instanceof Error ? error.message : String(error),
    );
    store = undefined;
  }
} else {
  console.log('⚠️  Using memory store for rate limiting (Redis not available or disabled)');
}

const sharedOptions = {
  standardHeaders: true,
  legacyHeaders: false,
};

export const generalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  limit: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  store,
  ...sharedOptions,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    success: false,
    message: 'Too many login attempts, please wait.',
  },
  store,
  ...sharedOptions,
});
