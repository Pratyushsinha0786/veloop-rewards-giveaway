import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './server/db.ts';
import { User } from './server/models/index.ts';
import { seedDatabase } from './server/seed.ts';
import { drawExpiredGiveaways } from './server/services/drawService.ts';
import { AppError } from './server/utils/errors.ts';

// Routes
import authRoutes from './server/routes/auth.ts';
import giveawayRoutes from './server/routes/giveaways.ts';
import claimsRoutes from './server/routes/claims.ts';
import adminRoutes from './server/routes/admin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // 1. Trust proxy
  app.set('trust proxy', 1);

  // 2. Security & Parsers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(cors());
  app.use(express.json({ limit: '20kb' }));

  // 3. Connect to Database & Auto-seed if empty
  await connectDB();
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('No users found in database. Initializing seed data...');
    await seedDatabase();
  }

  // 4. Background draws: run once on start & every 60s
  await drawExpiredGiveaways();
  setInterval(() => {
    drawExpiredGiveaways();
  }, 60 * 1000);

  // 5. Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // 6. Mount API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/giveaways', giveawayRoutes);
  app.use('/api/claims', claimsRoutes);
  app.use('/api/admin', adminRoutes);

  // 7. 404 for unmatched API routes
  app.all('/api/*', (req, _res, next) => {
    next(new AppError(`API endpoint ${req.method} ${req.originalUrl} not found.`, 404, 'NOT_FOUND'));
  });

  // 8. Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'An unexpected server error occurred.';
    let code = err.code || 'INTERNAL_ERROR';

    // Mongoose CastError (e.g. invalid ObjectId)
    if (err.name === 'CastError') {
      statusCode = 400;
      message = `Invalid value for ${err.path}: ${err.value}`;
      code = 'INVALID_INPUT';
    }

    // Mongoose ValidationError
    if (err.name === 'ValidationError') {
      statusCode = 400;
      const errors = Object.values(err.errors || {}).map((e: any) => e.message);
      message = errors.join(', ') || 'Validation error';
      code = 'VALIDATION_ERROR';
    }

    // Mongoose Duplicate Key Error (E11000)
    if (err.code === 11000) {
      statusCode = 409;
      message = 'A record with duplicate unique fields already exists.';
      code = 'DUPLICATE_KEY';
    }

    // Never leak stack traces in production or error responses
    res.status(statusCode).json({
      code,
      message,
    });
  });

  // 9. Vite Dev Middleware / Static Assets
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  // 10. Start Listening
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VELOOP Rewards server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
