import { Poll } from '../models/Poll.js';
import { Vote } from '../models/Vote.js';
import { AppError } from '../utils/AppError.js';

function isEnded(poll) {
  return Boolean(poll.expiresAt && poll.expiresAt <= new Date());
}

export async function createPoll({ question, options, expiresAt }, userId) {
  if (!question || !Array.isArray(options)) {
    throw new AppError('question and options are required', 400, 'VALIDATION_ERROR');
  }
  if (options.length < 2 || options.length > 6) {
    throw new AppError('a poll must have between 2 and 6 options', 400, 'VALIDATION_ERROR');
  }
  let expiresAtDate = null;
  if (expiresAt) {
    expiresAtDate = new Date(expiresAt);
    if (expiresAtDate <= new Date()) {
      throw new AppError('expiresAt must be in the future', 400, 'VALIDATION_ERROR');
    }
  }
  const poll = await Poll.create({
    question,
    options: options.map((text) => ({ text })),
    createdBy: userId,
    expiresAt: expiresAtDate,
  });
  return attachResults(poll);
}

async function attachResults(poll) {
  const votes = await Vote.find({ pollId: poll._id });
  const counts = poll.options.map(() => 0);
  for (const vote of votes) {
    counts[vote.optionIndex] += 1;
  }
  return {
    id: poll._id.toString(),
    question: poll.question,
    createdBy: poll.createdBy.toString(),
    createdAt: poll.createdAt,
    expiresAt: poll.expiresAt,
    isEnded: isEnded(poll),
    options: poll.options.map((opt, i) => ({ text: opt.text, votes: counts[i] })),
    totalVotes: votes.length,
  };
}

export async function listPolls() {
  const polls = await Poll.find({ deletedAt: null }).sort({ createdAt: -1 });
  return Promise.all(polls.map(attachResults));
}

export async function getPoll(pollId, userId) {
  const poll = await Poll.findOne({ _id: pollId, deletedAt: null });
  if (!poll) {
    throw new AppError('poll not found', 404, 'NOT_FOUND');
  }
  const result = await attachResults(poll);
  const existingVote = userId ? await Vote.findOne({ pollId, userId }) : null;
  return { ...result, votedOptionIndex: existingVote ? existingVote.optionIndex : null };
}

export async function castVote(pollId, userId, optionIndex) {
  const poll = await Poll.findOne({ _id: pollId, deletedAt: null });
  if (!poll) {
    throw new AppError('poll not found', 404, 'NOT_FOUND');
  }
  if (isEnded(poll)) {
    throw new AppError('this poll has ended', 403, 'POLL_ENDED');
  }
  if (typeof optionIndex !== 'number' || optionIndex < 0 || optionIndex >= poll.options.length) {
    throw new AppError('invalid option index', 400, 'VALIDATION_ERROR');
  }
  const existing = await Vote.findOne({ pollId, userId });
  if (existing) {
    throw new AppError('you have already voted on this poll', 409, 'ALREADY_VOTED');
  }
  await Vote.create({ pollId, userId, optionIndex });
  return getPoll(pollId, userId);
}

export async function deletePoll(pollId, userId) {
  const poll = await Poll.findOne({ _id: pollId, deletedAt: null });
  if (!poll) {
    throw new AppError('poll not found', 404, 'NOT_FOUND');
  }
  if (poll.createdBy.toString() !== userId) {
    throw new AppError('only the poll owner can delete this poll', 403, 'FORBIDDEN');
  }
  poll.deletedAt = new Date();
  await poll.save();
}
