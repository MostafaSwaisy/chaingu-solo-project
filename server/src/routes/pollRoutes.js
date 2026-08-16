import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { createPoll, listPolls, getPoll, castVote, deletePoll } from '../services/pollService.js';

export const pollRouter = Router();

pollRouter.get('/', async (req, res, next) => {
  try {
    const polls = await listPolls();
    res.json({ polls });
  } catch (err) {
    next(err);
  }
});

pollRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const poll = await createPoll(req.body, req.userId);
    res.status(201).json({ poll });
  } catch (err) {
    next(err);
  }
});

pollRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const poll = await getPoll(req.params.id, req.userId ?? null);
    res.json({ poll });
  } catch (err) {
    next(err);
  }
});

pollRouter.post('/:id/vote', requireAuth, async (req, res, next) => {
  try {
    const poll = await castVote(req.params.id, req.userId, req.body.optionIndex);
    res.json({ poll });
  } catch (err) {
    next(err);
  }
});

pollRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await deletePoll(req.params.id, req.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
