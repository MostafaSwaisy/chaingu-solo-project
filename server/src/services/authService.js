import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export async function registerUser({ username, email, password }) {
  if (!username || !email || !password) {
    throw new AppError('username, email, and password are required', 400, 'VALIDATION_ERROR');
  }
  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    throw new AppError('username or email already in use', 409, 'DUPLICATE_USER');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, passwordHash });
  return { id: user._id.toString(), username: user.username, email: user.email };
}

export async function loginUser({ identifier, password }) {
  if (!identifier || !password) {
    throw new AppError('username/email and password are required', 400, 'VALIDATION_ERROR');
  }
  const user = await User.findOne({
    $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
  });
  if (!user) {
    throw new AppError('invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw new AppError('invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
  const token = jwt.sign(
    { sub: user._id.toString(), username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  return { token, user: { id: user._id.toString(), username: user.username, email: user.email } };
}
