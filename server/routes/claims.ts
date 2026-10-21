import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { GiveawayWinner, PrizeClaim, Prize, AuditLog } from '../models/index.ts';
import { protect, AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../utils/errors.ts';

const router = Router();

// GET /api/claims/mine (protect)
router.get('/mine', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;

    const winners = await GiveawayWinner.find({ userId })
      .populate('prizeId', 'name slug image prizeType position')
      .populate('giveawayId', 'title endAt')
      .sort({ selectedAt: -1, createdAt: -1 })
      .lean();

    const winnerIds = winners.map((w) => w._id);
    const claims = await PrizeClaim.find({ winnerId: { $in: winnerIds } }).lean();

    const claimByWinnerId = new Map<string, any>();
    for (const c of claims) {
      claimByWinnerId.set(c.winnerId.toString(), {
        _id: c._id,
        status: c.status,
        claimDetails: c.claimDetails,
        createdAt: c.createdAt,
      });
    }

    const results = winners.map((w) => ({
      ...w,
      prize: w.prizeId,
      giveaway: w.giveawayId,
      claim: claimByWinnerId.get(w._id.toString()) || null,
    }));

    res.json({ wins: results });
  } catch (err) {
    next(err);
  }
});

// POST /api/claims/:winnerId (protect)
router.post('/:winnerId', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { winnerId } = req.params;
    if (!mongoose.isValidObjectId(winnerId)) {
      throw new AppError('Invalid winner identifier.', 400, 'INVALID_ID');
    }

    const { claimDetails } = req.body;
    if (!claimDetails || typeof claimDetails !== 'object') {
      throw new AppError('Please provide your claim details.', 400, 'MISSING_CLAIM_DETAILS');
    }

    const userId = req.user!._id;

    // Check winner row
    const winner = await GiveawayWinner.findById(winnerId).populate('prizeId');
    if (!winner || winner.userId.toString() !== userId.toString()) {
      throw new AppError("We couldn't find this reward on your account.", 404, 'WINNER_NOT_FOUND');
    }

    if (winner.status !== 'UNCLAIMED') {
      throw new AppError('This reward has already been claimed.', 409, 'ALREADY_CLAIMED');
    }

    const prize = winner.prizeId as any;
    const prizeType = prize?.prizeType || 'PHYSICAL';

    let validatedDetails: any = {};

    if (prizeType === 'PHYSICAL') {
      const fullName = (claimDetails.fullName || '').trim();
      const rawPhone = (claimDetails.phone || '').trim();
      const address = (claimDetails.address || '').trim();
      const city = (claimDetails.city || '').trim();
      const state = (claimDetails.state || '').trim();
      const pinCode = (claimDetails.pinCode || '').trim();

      if (!fullName || fullName.length < 3) {
        throw new AppError('Full name must be at least 3 characters long.', 400, 'INVALID_NAME');
      }

      // Phone validation: strip spaces, dashes, parens and leading +91 or 91
      let cleanedPhone = rawPhone.replace(/[\s\-\(\)]/g, '');
      if (cleanedPhone.startsWith('+91')) {
        cleanedPhone = cleanedPhone.slice(3);
      } else if (cleanedPhone.startsWith('91') && cleanedPhone.length === 12) {
        cleanedPhone = cleanedPhone.slice(2);
      }

      if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
        throw new AppError('Please enter a valid 10-digit Indian mobile number.', 400, 'INVALID_PHONE');
      }

      if (!address || address.length < 10) {
        throw new AppError('Delivery address must be at least 10 characters.', 400, 'INVALID_ADDRESS');
      }

      if (!city) {
        throw new AppError('City is required.', 400, 'INVALID_CITY');
      }

      if (!state) {
        throw new AppError('State is required.', 400, 'INVALID_STATE');
      }

      if (!/^\d{6}$/.test(pinCode)) {
        throw new AppError('PIN code must be exactly 6 digits.', 400, 'INVALID_PINCODE');
      }

      validatedDetails = {
        fullName,
        phone: cleanedPhone,
        address,
        city,
        state,
        pinCode,
      };
    } else {
      // GIFT_CARD or DIGITAL -> email only
      const email = (claimDetails.email || '').trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        throw new AppError('Please enter a valid email address for delivery.', 400, 'INVALID_EMAIL');
      }
      validatedDetails = { email };
    }

    // Lock winner record
    const lockedWinner = await GiveawayWinner.findOneAndUpdate(
      { _id: winner._id, status: 'UNCLAIMED' },
      { $set: { status: 'CLAIM_SUBMITTED' } },
      { new: true }
    );

    if (!lockedWinner) {
      throw new AppError('This reward has already been claimed.', 409, 'ALREADY_CLAIMED');
    }

    let claimDoc: any;
    try {
      claimDoc = await PrizeClaim.create({
        winnerId: winner._id,
        userId,
        giveawayId: winner.giveawayId,
        prizeId: prize._id,
        prizeType,
        claimDetails: validatedDetails,
        status: 'SUBMITTED',
      });
    } catch (claimErr) {
      // Rollback winner status to UNCLAIMED
      await GiveawayWinner.findByIdAndUpdate(winner._id, { $set: { status: 'UNCLAIMED' } });
      throw claimErr;
    }

    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '';

    await AuditLog.create({
      userId,
      action: 'CLAIM_SUBMITTED',
      details: {
        winnerId: winner._id,
        claimId: claimDoc._id,
        prizeType,
      },
      ip: clientIp,
    });

    const responseMessage =
      prizeType === 'PHYSICAL'
        ? "Got it! We'll verify your details and ship your prize soon."
        : "Got it! Your voucher will be emailed once it's been verified.";

    res.status(201).json({
      message: responseMessage,
      claim: claimDoc,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
