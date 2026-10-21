import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from './auth.ts';
import { GiveawayParticipation, FraudEvent } from '../models/index.ts';
import { AppError } from '../utils/errors.ts';

export async function fraudCheck(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const rawDeviceHash = req.headers['x-device-hash'];
    const deviceHash = typeof rawDeviceHash === 'string' ? rawDeviceHash.trim() : '';

    if (!deviceHash || deviceHash.length > 100) {
      return next(
        new AppError(
          'Missing device information. Please refresh the page and try again.',
          400,
          'MISSING_DEVICE_HASH'
        )
      );
    }

    const { id: giveawayId } = req.params;
    if (!giveawayId || !mongoose.isValidObjectId(giveawayId)) {
      return next(new AppError('Invalid giveaway identifier.', 400, 'INVALID_ID'));
    }

    const currentUserId = req.user?._id;
    if (!currentUserId) {
      return next(new AppError('Please log in to continue.', 401, 'UNAUTHORIZED'));
    }

    // Check if ANOTHER user already has a participation in this giveaway with the same deviceHash
    const existingParticipationWithDevice = await GiveawayParticipation.findOne({
      giveawayId,
      deviceHash,
      userId: { $ne: currentUserId },
    });

    if (existingParticipationWithDevice) {
      const clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        '';

      // Log FraudEvent
      await FraudEvent.create({
        userId: currentUserId,
        giveawayId: new mongoose.Types.ObjectId(giveawayId),
        ip: clientIp,
        deviceHash,
        riskScore: 85,
        action: 'BLOCKED',
        reason: 'Multiple accounts entered the same giveaway from identical device hash',
      });

      return res.status(403).json({
        code: 'SUSPICIOUS_ACTIVITY',
        message:
          'Another account has already entered this giveaway from this device. Only one account per device can take part.',
      });
    }

    // Attach deviceHash for use in service
    (req as any).deviceHash = deviceHash;
    next();
  } catch (err) {
    next(err);
  }
}
