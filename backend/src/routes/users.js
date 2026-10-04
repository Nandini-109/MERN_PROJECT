import express from 'express';
import User from '../models/User.js';
import Skill from '../models/Skill.js';
import Review from '../models/Review.js';
import ExchangeRequest from '../models/ExchangeRequest.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  asyncHandler, HttpError, validateId, escapeRegex, cleanList, cleanLevels,
  profileCompletion, matchBetween, publicUser, AVAILABILITY
} from '../utils/helpers.js';

const router = express.Router();
const SAFE_SELECT = '-password -email -favorites -__v';

const exactRegexes = (names) => names.map((n) => new RegExp(`^${escapeRegex(n)}$`, 'i'));

function withMatch(me, users, favoriteIds) {
  const favs = new Set((favoriteIds || []).map(String));
  return users.map((u) => {
    const m = matchBetween(me, u);
    return publicUser(u, { match: m, isFavorite: favs.has(String(u._id)) });
  });
}

// ---------- Own profile ----------
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').lean();
  res.json({ ...user, completion: profileCompletion(user) });
}));

router.put('/me', protect, asyncHandler(async (req, res) => {
  const body = req.body;
  const updates = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) throw new HttpError(400, 'Name must be at least 2 characters');
    updates.name = name.slice(0, 60);
  }
  if (body.bio !== undefined) updates.bio = String(body.bio).trim().slice(0, 500);
  if (body.location !== undefined) updates.location = String(body.location).trim().slice(0, 80);
  if (body.headline !== undefined) updates.headline = String(body.headline).trim().slice(0, 100);

  if (body.avatar !== undefined) {
    const avatar = String(body.avatar);
    if (avatar && (!/^data:image\/(png|jpe?g|webp);base64,/.test(avatar) || avatar.length > 300000)) {
      throw new HttpError(400, 'Profile photo must be a small PNG, JPG or WebP image');
    }
    updates.avatar = avatar;
  }
  if (body.availability !== undefined) {
    updates.availability = cleanList(body.availability, { max: 4, maxLen: 30 }).filter((a) => AVAILABILITY.includes(a));
  }

  const current = await User.findById(req.user._id).select('teachSkills teachLevels');
  if (body.teachSkills !== undefined) updates.teachSkills = cleanList(body.teachSkills);
  if (body.learnSkills !== undefined) updates.learnSkills = cleanList(body.learnSkills);

  if (body.teachSkills !== undefined || body.teachLevels !== undefined) {
    const skills = updates.teachSkills ?? current.teachSkills;
    const incoming = body.teachLevels ?? current.teachLevels.map((l) => ({ skill: l.skill, level: l.level }));
    const levels = cleanLevels(incoming, skills);
    // Every offered skill gets a level (default Intermediate) so badges are always shown.
    for (const s of skills) if (!levels.some((l) => l.skill.toLowerCase() === s.toLowerCase())) {
      levels.push({ skill: s, level: 'Intermediate' });
    }
    updates.teachLevels = levels;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
    .select('-password').lean();
  res.json({ ...user, completion: profileCompletion(user) });
}));

// ---------- Discovery ----------
router.get('/discover', protect, asyncHandler(async (req, res) => {
  const { category = '', level = '', availability = '', sort = 'match', favorites } = req.query;
  const q = String(req.query.skill ?? req.query.q ?? '').trim();
  const me = req.user;

  const and = [{ _id: { $ne: me._id } }];

  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    and.push({ $or: [{ teachSkills: rx }, { learnSkills: rx }, { name: rx }, { headline: rx }] });
  }
  if (category) {
    const inCategory = await Skill.find({ category: new RegExp(`^${escapeRegex(category)}$`, 'i') }).select('name').lean();
    and.push({ teachSkills: { $in: exactRegexes(inCategory.map((s) => s.name)) } });
  }
  if (level) and.push({ 'teachLevels.level': level });
  if (availability) {
    const list = String(availability).split(',').filter((a) => AVAILABILITY.includes(a));
    if (list.length) and.push({ availability: { $in: list } });
  }
  if (favorites === 'true') and.push({ _id: { $in: me.favorites } });

  // Filtering happens in MongoDB; scoring/sorting for a few hundred rows is done in memory.
  const found = await User.find({ $and: and }).select(SAFE_SELECT).limit(500).lean();
  let users = withMatch(me, found, me.favorites);

  const byName = (a, b) => a.name.localeCompare(b.name);
  const sorters = {
    match: (a, b) => b.match.score - a.match.score || b.ratingAvg - a.ratingAvg || byName(a, b),
    rating: (a, b) => b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount || byName(a, b),
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    name: byName
  };
  users.sort(sorters[sort] || sorters.match);

  // Legacy clients (no `page` parameter) still receive a plain array.
  if (!req.query.page) return res.json(users.slice(0, 50));

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 48);
  const total = users.length;
  const pages = Math.max(Math.ceil(total / limit), 1);
  const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), pages);
  res.json({ users: users.slice((page - 1) * limit, page * limit), total, page, pages, limit });
}));

router.get('/recommended', protect, asyncHandler(async (req, res) => {
  const me = req.user;
  const or = [];
  if (me.learnSkills.length) or.push({ teachSkills: { $in: exactRegexes(me.learnSkills) } });
  if (me.teachSkills.length) or.push({ learnSkills: { $in: exactRegexes(me.teachSkills) } });

  const filter = { _id: { $ne: me._id } };
  if (or.length) filter.$or = or;
  const found = await User.find(filter).select(SAFE_SELECT).sort({ ratingAvg: -1, createdAt: -1 }).limit(100).lean();
  const users = withMatch(me, found, me.favorites)
    .sort((a, b) => b.match.score - a.match.score || b.ratingAvg - a.ratingAvg)
    .slice(0, 6);
  res.json(users);
}));

// ---------- Favorites ----------
router.get('/favorites', protect, asyncHandler(async (req, res) => {
  const found = await User.find({ _id: { $in: req.user.favorites } }).select(SAFE_SELECT).lean();
  res.json(withMatch(req.user, found, req.user.favorites));
}));

router.post('/:id/favorite', protect, validateId(), asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw new HttpError(400, 'You cannot bookmark yourself');
  if (!(await User.exists({ _id: req.params.id }))) throw new HttpError(404, 'User not found');

  const has = req.user.favorites.some((f) => String(f) === req.params.id);
  await User.updateOne(
    { _id: req.user._id },
    has ? { $pull: { favorites: req.params.id } } : { $addToSet: { favorites: req.params.id } }
  );
  res.json({ isFavorite: !has });
}));

// ---------- Admin ----------
router.get('/admin/all', protect, adminOnly, asyncHandler(async (_req, res) => {
  const users = await User.find().select('-password -avatar').sort({ createdAt: -1 });
  res.json(users);
}));

router.delete('/admin/:id', protect, adminOnly, validateId(), asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (String(id) === String(req.user._id)) throw new HttpError(400, 'You cannot delete your own account');
  const exchanges = await ExchangeRequest.find({ $or: [{ sender: id }, { receiver: id }] }).select('_id');
  const ids = exchanges.map((e) => e._id);
  await Promise.all([
    ExchangeRequest.deleteMany({ _id: { $in: ids } }),
    Message.deleteMany({ exchange: { $in: ids } }),
    Review.deleteMany({ $or: [{ reviewer: id }, { reviewee: id }] }),
    Notification.deleteMany({ user: id }),
    User.updateMany({}, { $pull: { favorites: id } }),
    User.findByIdAndDelete(id)
  ]);
  res.json({ message: 'User deleted' });
}));

// ---------- Public profile (keep last: generic :id route) ----------
router.get('/:id', protect, validateId(), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(SAFE_SELECT).lean();
  if (!user) throw new HttpError(404, 'This profile does not exist');

  const me = req.user;
  const [completed, reviews, shared] = await Promise.all([
    ExchangeRequest.countDocuments({ status: 'completed', $or: [{ sender: user._id }, { receiver: user._id }] }),
    Review.find({ reviewee: user._id }).sort({ createdAt: -1 }).limit(10).populate('reviewer', 'name avatar').lean(),
    ExchangeRequest.findOne({
      status: { $in: ['accepted', 'completed'] },
      $or: [{ sender: me._id, receiver: user._id }, { sender: user._id, receiver: me._id }]
    }).sort({ updatedAt: -1 }).select('_id').lean()
  ]);

  res.json({
    ...publicUser(user, {
      match: matchBetween(me, user),
      isFavorite: me.favorites.some((f) => String(f) === String(user._id)),
      completedExchanges: completed,
      sharedExchangeId: shared?._id || null
    }),
    reviews
  });
}));

export default router;
