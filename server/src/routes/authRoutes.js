import { Router } from 'express';
import { registerUser, loginUser } from '../services/authService.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
