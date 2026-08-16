import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('authentication required', 401, 'UNAUTHENTICATED'));
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    next(new AppError('invalid or expired token', 401, 'INVALID_TOKEN'));
  }
}
