import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { User } from '../models/User.js';
import { loginSchema } from '../validation.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later' },
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.comparePassword(password))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  res.json({ token, user });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) throw new HttpError(401, 'User no longer exists');
  res.json({ user });
});

export default router;
