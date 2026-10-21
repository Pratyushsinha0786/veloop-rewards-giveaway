import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.ts';
import { AppError } from '../utils/errors.ts';

// In-memory rate limiter keyed by userId: max 10 requests per 15 minutes
interface RateRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateRecord>();

export function joinRateLimiter(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.userId || req.user?._id?.toString() || req.ip || 'anonymous';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 10;

  const record = rateLimitMap.get(userId);

  if (!record || record.resetAt <= now) {
    rateLimitMap.set(userId, {
      count: 1,
      resetAt: now + windowMs,
    });
    return next();
  }

  if (record.count >= maxRequests) {
    const minutesLeft = Math.ceil((record.resetAt - now) / 60000);
    return next(
      new AppError(
        `Too many join attempts. Please wait ${minutesLeft} minute(s) before trying again.`,
        429,
        'RATE_LIMIT_EXCEEDED'
      )
    );
  }

  record.count += 1;
  next();
}
