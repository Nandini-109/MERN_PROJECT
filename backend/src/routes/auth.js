import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/helpers.js';

const router = express.Router();

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const authPayload = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

router.post('/register', asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || !email || !password) throw new HttpError(400, 'Name, email and password are required');
  if (name.length < 2) throw new HttpError(400, 'Name must be at least 2 characters');
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please enter a valid email address');
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');

  if (await User.findOne({ email })) throw new HttpError(409, 'Email already registered');

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash });
  res.status(201).json({ token: tokenFor(user), user: authPayload(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.password))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  res.json({ token: tokenFor(user), user: authPayload(user) });
}));

// New: change password from the profile page.
router.put('/password', protect, asyncHandler(async (req, res) => {
  const { currentPassword = '', newPassword = '' } = req.body;
  if (newPassword.length < 6) throw new HttpError(400, 'New password must be at least 6 characters');
  const user = await User.findById(req.user._id);
  if (!(await bcrypt.compare(String(currentPassword), user.password))) {
    throw new HttpError(401, 'Current password is incorrect');
  }
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: 'Password updated' });
}));

export default router;
