import { Router, Response } from 'express';
import { User } from '../models/index.ts';
import { generateToken, protect, AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../utils/errors.ts';

const router = Router();

function formatUser(user: any) {
  return {
    id: user._id.toString(),
    customUserId: user.customUserId,
    name: user.name,
    email: user.email,
    role: user.role,
    balances: user.balances,
  };
}

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { customUserId } = req.body;
    if (!customUserId) {
      throw new AppError('customUserId is required to log in.', 400);
    }

    const user = await User.findOne({ customUserId: customUserId.trim() });
    if (!user) {
      throw new AppError(`User with ID ${customUserId} not found.`, 404, 'USER_NOT_FOUND');
    }

    const token = generateToken({ id: user._id.toString(), role: user.role });
    res.json({
      token,
      user: formatUser(user),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req: AuthRequest, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('User session expired.', 401);
    }
    res.json({
      user: formatUser(req.user),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/demo-users
router.get('/demo-users', async (_req, res, next) => {
  try {
    const users = await User.find({})
      .select('customUserId name role balances')
      .sort({ customUserId: 1 });

    res.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        customUserId: u.customUserId,
        name: u.name,
        role: u.role,
        balances: u.balances,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
