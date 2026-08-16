import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export async function requireAdmin(req, res, next) {
  const user = await User.findOne({ _id: req.userId, deletedAt: null });
  if (!user || !user.isAdmin) {
    return next(new AppError('admin access required', 403, 'FORBIDDEN'));
  }
  next();
}
