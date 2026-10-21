import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { protect, adminOnly, AuthRequest } from '../middleware/auth.ts';
import { drawWinners } from '../services/drawService.ts';
import { FraudEvent } from '../models/index.ts';
import { seedDatabase } from '../seed.ts';
import { AppError } from '../utils/errors.ts';

const router = Router();

// Apply protect + adminOnly to all admin routes
router.use(protect, adminOnly);

// POST /api/admin/giveaways/:id/draw
router.post('/giveaways/:id/draw', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Invalid giveaway identifier.', 400, 'INVALID_ID');
    }

    const result = await drawWinners(id, {
      force: true,
      actorId: req.user?._id?.toString(),
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/fraud-events
router.get('/fraud-events', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const events = await FraudEvent.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'customUserId name email')
      .populate('giveawayId', 'title slug');

    res.json({ fraudEvents: events });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/reset-demo
router.post('/reset-demo', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await seedDatabase();
    res.json({
      message: 'Demo database reset successfully with default users, prizes and giveaways.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
