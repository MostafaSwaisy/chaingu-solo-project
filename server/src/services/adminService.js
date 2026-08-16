import { User } from '../models/User.js';
import { Poll } from '../models/Poll.js';
import { registerUser } from './authService.js';
import { AppError } from '../utils/AppError.js';

function toUserSummary(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
    deletedAt: user.deletedAt,
  };
}

function toPollSummary(poll) {
  const isEnded = Boolean(poll.expiresAt && poll.expiresAt <= new Date());
  return {
    id: poll._id.toString(),
    question: poll.question,
    createdBy: poll.createdBy.toString(),
    createdAt: poll.createdAt,
    expiresAt: poll.expiresAt,
    isEnded,
    deletedAt: poll.deletedAt,
  };
}

export async function listUsers() {
  const users = await User.find().sort({ createdAt: -1 });
  return users.map(toUserSummary);
}

export async function createUser({ username, email, password, isAdmin = false }) {
  return registerUser({ username, email, password, isAdmin });
}

export async function softDeleteUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('user not found', 404, 'NOT_FOUND');
  }
  user.deletedAt = new Date();
  await user.save();
}

export async function listPollsAdmin() {
  const polls = await Poll.find().sort({ createdAt: -1 });
  return polls.map(toPollSummary);
}

export async function endPollNow(pollId) {
  const poll = await Poll.findById(pollId);
  if (!poll) {
    throw new AppError('poll not found', 404, 'NOT_FOUND');
  }
  poll.expiresAt = new Date();
  await poll.save();
  return toPollSummary(poll);
}

export async function softDeletePoll(pollId) {
  const poll = await Poll.findById(pollId);
  if (!poll) {
    throw new AppError('poll not found', 404, 'NOT_FOUND');
  }
  poll.deletedAt = new Date();
  await poll.save();
}
