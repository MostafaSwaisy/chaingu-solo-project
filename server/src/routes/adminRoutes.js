import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  listUsers,
  createUser,
  softDeleteUser,
  listPollsAdmin,
  endPollNow,
  softDeletePoll,
} from '../services/adminService.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/users', async (req, res, next) => {
  try {
    const users = await listUsers();
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/users', async (req, res, next) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/users/:id', async (req, res, next) => {
  try {
    await softDeleteUser(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/polls', async (req, res, next) => {
  try {
    const polls = await listPollsAdmin();
    res.json({ polls });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/polls/:id/end', async (req, res, next) => {
  try {
    const poll = await endPollNow(req.params.id);
    res.json({ poll });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/polls/:id', async (req, res, next) => {
  try {
    await softDeletePoll(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
