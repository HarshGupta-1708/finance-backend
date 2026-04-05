import rateLimit from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { redis } from '../config/redis';

const shouldUseRedisStore =
  process.env.RATE_LIMIT_USE_REDIS === 'true' ||
  (process.env.NODE_ENV === 'production' && Boolean(process.env.REDIS_URL));

const createStore = () => {
  if (!shouldUseRedisStore) {
    return undefined;
  }

  try {
    return new RedisStore({
      sendCommand: async (...args: string[]): Promise<RedisReply> => {
        const [command, ...rest] = args;
        return (await redis.call(command, ...rest)) as RedisReply;
      },
      prefix: 'rl:',
    });
  } catch (error) {
    console.warn(
      'Failed to initialize Redis rate limiter store, using memory store:',
      error instanceof Error ? error.message : String(error),
    );
    return undefined;
  }
};

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
  store: createStore(),
  ...sharedOptions,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    success: false,
    message: 'Too many login attempts, please wait.',
  },
  store: createStore(),
  ...sharedOptions,
});
