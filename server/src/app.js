import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/authRoutes.js';
import { pollRouter } from './routes/pollRoutes.js';
import { adminRouter } from './routes/adminRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter);
  app.use('/api/polls', pollRouter);
  app.use('/api/admin', adminRouter);

  app.use(errorHandler);

  return app;
}
