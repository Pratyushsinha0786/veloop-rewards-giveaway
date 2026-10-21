import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/index.ts';
import { AppError } from '../utils/errors.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'veloop-rewards-super-secret-key-2025';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
}

export function generateToken(payload: { id: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function protect(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Please log in to continue.', 401, 'UNAUTHORIZED'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new AppError('Please log in to continue.', 401, 'UNAUTHORIZED'));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('User session expired or user no longer exists.', 401, 'USER_NOT_FOUND'));
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (err: any) {
    return next(new AppError('Your session has expired. Please log in again.', 401, 'INVALID_TOKEN'));
  }
}

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Access denied. Administrator privileges required.', 403, 'FORBIDDEN'));
  }
  next();
}
