import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  Giveaway,
  Prize,
  GiveawayParticipation,
  GiveawayEntryTransaction,
  GiveawayWinner,
  AuditLog,
  User,
} from '../models/index.ts';
import { protect, AuthRequest } from '../middleware/auth.ts';
import { joinRateLimiter } from '../middleware/rateLimit.ts';
import { fraudCheck } from '../middleware/fraudCheck.ts';
import { generateTransactionId } from '../utils/helpers.ts';
import { AppError } from '../utils/errors.ts';

const router = Router();

// 1. GET /api/giveaways/current
router.get('/current', async (_req, res, next) => {
  try {
    const giveaway = await Giveaway.findOne({ status: 'ACTIVE' })
      .sort({ createdAt: -1 })
      .populate({
        path: 'prizes',
        match: { isActive: true },
      });

    if (!giveaway) {
      throw new AppError('There is no live giveaway right now', 404, 'NO_ACTIVE_GIVEAWAY');
    }

    const [activeCount, prizesDelivered, winnersSoFar] = await Promise.all([
      Giveaway.countDocuments({ status: 'ACTIVE' }),
      GiveawayWinner.countDocuments({ status: 'COMPLETED' }),
      GiveawayWinner.countDocuments({}),
    ]);

    res.json({
      giveaway,
      stats: {
        activeGiveaways: activeCount,
        participants: giveaway.totalParticipants,
        prizesDelivered,
        winnersSoFar,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 2. GET /api/giveaways/previous
router.get('/previous', async (_req, res, next) => {
  try {
    const pastGiveaways = await Giveaway.find({
      status: { $in: ['ENDED', 'ARCHIVED'] },
    })
      .sort({ endAt: -1, createdAt: -1 })
      .limit(10)
      .lean();

    const giveawayIds = pastGiveaways.map((g) => g._id);

    // Fetch winners for these giveaways
    const winners = await GiveawayWinner.find({
      giveawayId: { $in: giveawayIds },
    })
      .populate('prizeId', 'name position prizeType image')
      .lean();

    // Map winners by giveawayId
    const winnersByGiveaway = new Map<string, any[]>();
    for (const w of winners) {
      const gId = w.giveawayId.toString();
      if (!winnersByGiveaway.has(gId)) {
        winnersByGiveaway.set(gId, []);
      }
      winnersByGiveaway.get(gId)!.push({
        _id: w._id,
        maskedUserId: w.maskedUserId,
        status: w.status,
        selectedAt: w.selectedAt,
        prize: w.prizeId
          ? {
              name: (w.prizeId as any).name,
              position: (w.prizeId as any).position,
              prizeType: (w.prizeId as any).prizeType,
              image: (w.prizeId as any).image,
            }
          : null,
      });
    }

    const result = pastGiveaways.map((g) => ({
      ...g,
      winners: winnersByGiveaway.get(g._id.toString()) || [],
    }));

    res.json({ giveaways: result });
  } catch (err) {
    next(err);
  }
});

// 3. GET /api/giveaways/prize/:slug
router.get('/prize/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const prize = await Prize.findOne({ slug: slug.toLowerCase() });
    if (!prize) {
      throw new AppError('Prize not found.', 404, 'PRIZE_NOT_FOUND');
    }

    // Find ACTIVE giveaway that contains this prize
    const giveaway = await Giveaway.findOne({
      status: 'ACTIVE',
      prizes: prize._id,
    });

    res.json({
      prize,
      giveaway: giveaway || null,
    });
  } catch (err) {
    next(err);
  }
});

// 4. GET /api/giveaways/ticker
router.get('/ticker', async (_req, res, next) => {
  try {
    const recentWinners = await GiveawayWinner.find({})
      .sort({ selectedAt: -1, createdAt: -1 })
      .limit(12)
      .populate('prizeId', 'name position')
      .lean();

    const tickerItems = recentWinners
      .filter((w) => w.prizeId && (w.prizeId as any).name)
      .map((w) => ({
        id: w._id.toString(),
        message: `${w.maskedUserId} won ${(w.prizeId as any).name}`,
        selectedAt: w.selectedAt,
      }));

    res.json({ ticker: tickerItems });
  } catch (err) {
    next(err);
  }
});

// 5. GET /api/giveaways/:id/winners
router.get('/:id/winners', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Invalid giveaway identifier.', 400, 'INVALID_ID');
    }

    const giveaway = await Giveaway.findById(id);
    if (!giveaway) {
      throw new AppError('Giveaway not found.', 404, 'NOT_FOUND');
    }

    if (['UPCOMING', 'ACTIVE', 'DRAWING'].includes(giveaway.status)) {
      return res.json({
        status: giveaway.status,
        winners: [],
        message:
          giveaway.status === 'DRAWING'
            ? 'Winners are currently being drawn! Please check back in a moment.'
            : 'Winners will be announced once the giveaway ends.',
      });
    }

    const winners = await GiveawayWinner.find({ giveawayId: id })
      .populate('prizeId', 'name position prizeType image')
      .sort({ selectedAt: -1 });

    res.json({
      status: giveaway.status,
      winners,
      drawnAt: giveaway.drawnAt,
    });
  } catch (err) {
    next(err);
  }
});

// 6. GET /api/giveaways/:id/my-status (protect)
router.get('/:id/my-status', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Invalid giveaway identifier.', 400, 'INVALID_ID');
    }

    const userId = req.user!._id;
    const participation = await GiveawayParticipation.findOne({
      giveawayId: id,
      userId,
    }).populate('prizeId', 'name slug position image requiredCurrency entryFee');

    const freshUser = await User.findById(userId);

    if (participation) {
      return res.json({
        hasParticipated: true,
        participation: {
          ...participation.toObject(),
          prize: participation.prizeId,
        },
        currentBalances: freshUser?.balances || req.user!.balances,
      });
    }

    res.json({
      hasParticipated: false,
      participation: null,
      currentBalances: freshUser?.balances || req.user!.balances,
    });
  } catch (err) {
    next(err);
  }
});

// 7. POST /api/giveaways/:id/join (protect, rate limit, fraudCheck)
router.post(
  '/:id/join',
  protect,
  joinRateLimiter,
  fraudCheck,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id: giveawayId } = req.params;
      const { prizeId } = req.body;

      if (!prizeId || !mongoose.isValidObjectId(prizeId)) {
        throw new AppError('A valid prizeId is required to join.', 400, 'INVALID_PRIZE_ID');
      }

      const now = new Date();

      // Step 1: Load giveaway
      const giveaway = await Giveaway.findById(giveawayId);
      if (!giveaway) {
        throw new AppError('Giveaway not found.', 404, 'GIVEAWAY_NOT_FOUND');
      }

      if (giveaway.status !== 'ACTIVE' || now < giveaway.startAt || now > giveaway.endAt) {
        throw new AppError(
          'This giveaway is not open for entries right now.',
          400,
          'GIVEAWAY_NOT_OPEN'
        );
      }

      // Step 2: Validate prize belongs to giveaway and is active
      const prizeBelongs = giveaway.prizes.some((p) => p.toString() === prizeId.toString());
      if (!prizeBelongs) {
        throw new AppError(
          'The selected prize does not belong to this giveaway.',
          400,
          'PRIZE_MISMATCH'
        );
      }

      const prize = await Prize.findById(prizeId);
      if (!prize || !prize.isActive) {
        throw new AppError('This prize is currently inactive.', 404, 'PRIZE_INACTIVE');
      }

      const userId = req.user!._id;

      // Step 3: Check if already entered
      const existing = await GiveawayParticipation.findOne({
        userId,
        giveawayId,
      }).populate('prizeId', 'name');

      if (existing) {
        const enteredPrizeName = (existing.prizeId as any)?.name || 'a prize';
        throw new AppError(
          `You've already entered this giveaway for ${enteredPrizeName}.`,
          409,
          'ALREADY_ENTERED'
        );
      }

      // Step 4: Create transaction ID
      const transactionId = generateTransactionId();
      const deviceHash = (req as any).deviceHash || 'dev-unknown';
      const fee = prize.entryFee;
      const currency = prize.requiredCurrency;

      // Step 5: INSERT participation FIRST
      let participationDoc: any;
      try {
        participationDoc = await GiveawayParticipation.create({
          userId,
          giveawayId: giveaway._id,
          prizeId: prize._id,
          entryCurrency: currency,
          entryAmount: fee,
          deviceHash,
          transactionId,
          status: 'CONFIRMED',
          joinedAt: now,
        });
      } catch (err: any) {
        if (err.code === 11000) {
          throw new AppError(
            `You've already entered this giveaway for ${prize.name}.`,
            409,
            'ALREADY_ENTERED'
          );
        }
        throw err;
      }

      // Step 6: Deduct fee with ONE atomic conditional update
      const updatedUser = await User.findOneAndUpdate(
        {
          _id: userId,
          [`balances.${currency}`]: { $gte: fee },
        },
        {
          $inc: { [`balances.${currency}`]: -fee },
        },
        { new: true }
      );

      // Step 7: Rollback participation if insufficient funds
      if (!updatedUser) {
        await GiveawayParticipation.findByIdAndDelete(participationDoc._id);
        const freshUser = await User.findById(userId);
        const currentBalance = freshUser?.balances?.[currency] ?? 0;
        throw new AppError(
          `Not enough ${currency}. This entry needs ${fee}, you have ${currentBalance}.`,
          400,
          'INSUFFICIENT_BALANCE'
        );
      }

      // Step 8: Write ledger row, increment totalParticipants, and write AuditLog
      const balanceAfter = updatedUser.balances[currency];
      const balanceBefore = balanceAfter + fee;

      const ledger = await GiveawayEntryTransaction.create({
        userId,
        giveawayId: giveaway._id,
        prizeId: prize._id,
        currency,
        amount: fee,
        balanceBefore,
        balanceAfter,
        type: 'ENTRY_FEE',
        status: 'SUCCESS',
        transactionId,
      });

      await Giveaway.findByIdAndUpdate(giveaway._id, {
        $inc: { totalParticipants: 1 },
      });

      const clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        '';

      await AuditLog.create({
        userId,
        action: 'JOIN_GIVEAWAY',
        details: {
          giveawayId: giveaway._id,
          prizeId: prize._id,
          transactionId,
          entryFee: fee,
          currency,
          balanceBefore,
          balanceAfter,
        },
        ip: clientIp,
      });

      // Step 9: Return 201 response
      res.status(201).json({
        message: "You're in! Your entry has been recorded.",
        data: {
          participation: participationDoc,
          transaction: ledger,
          updatedBalance: updatedUser.balances,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
