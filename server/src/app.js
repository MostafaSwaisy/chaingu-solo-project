import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter);

  app.use(errorHandler);

  return app;
}
