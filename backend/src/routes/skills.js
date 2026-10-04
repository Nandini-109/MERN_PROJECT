import express from 'express';
import Skill from '../models/Skill.js';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler, HttpError, validateId, escapeRegex } from '../utils/helpers.js';

const router = express.Router();

router.get('/', asyncHandler(async (_req, res) => {
  const skills = await Skill.find().sort({ category: 1, name: 1 });
  res.json(skills);
}));

// Most-offered skills (used on the landing page and dashboard).
router.get('/popular', asyncHandler(async (_req, res) => {
  const rows = await User.aggregate([
    { $unwind: '$teachSkills' },
    { $group: { _id: { $toLower: '$teachSkills' }, name: { $first: '$teachSkills' }, teachers: { $sum: 1 } } },
    { $sort: { teachers: -1, name: 1 } },
    { $limit: 12 }
  ]);
  const catalog = await Skill.find().select('name category').lean();
  const cat = new Map(catalog.map((s) => [s.name.toLowerCase(), s.category]));
  res.json(rows.map((r) => ({ name: r.name, teachers: r.teachers, category: cat.get(r._id) || 'Other' })));
}));

// Categories with number of skills and teachers.
router.get('/categories', asyncHandler(async (_req, res) => {
  const [skills, rows] = await Promise.all([
    Skill.find().select('name category').lean(),
    User.aggregate([{ $unwind: '$teachSkills' }, { $group: { _id: { $toLower: '$teachSkills' }, n: { $sum: 1 } } }])
  ]);
  const teachers = new Map(rows.map((r) => [r._id, r.n]));
  const map = new Map();
  for (const s of skills) {
    const c = map.get(s.category) || { category: s.category, skills: 0, teachers: 0 };
    c.skills += 1;
    c.teachers += teachers.get(s.name.toLowerCase()) || 0;
    map.set(s.category, c);
  }
  res.json([...map.values()].sort((a, b) => b.teachers - a.teachers || a.category.localeCompare(b.category)));
}));

// Search suggestions: catalogue skills + people.
router.get('/suggest', protect, asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 1) return res.json([]);
  const rx = new RegExp(escapeRegex(q), 'i');
  const [skills, people] = await Promise.all([
    Skill.find({ name: rx }).sort({ name: 1 }).limit(6).select('name category').lean(),
    User.find({ name: rx, _id: { $ne: req.user._id } }).limit(3).select('name headline avatar').lean()
  ]);
  res.json([
    ...skills.map((s) => ({ type: 'skill', label: s.name, hint: s.category })),
    ...people.map((p) => ({ type: 'person', label: p.name, hint: p.headline || 'Member', id: p._id, avatar: p.avatar }))
  ]);
}));

router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const { name, category, description } = req.body;
  if (!String(name || '').trim() || !String(category || '').trim()) throw new HttpError(400, 'Skill name and category are required');
  const skill = await Skill.create({ name, category, description });
  res.status(201).json(skill);
}));

router.put('/:id', protect, adminOnly, validateId(), asyncHandler(async (req, res) => {
  const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!skill) throw new HttpError(404, 'Skill not found');
  res.json(skill);
}));

router.delete('/:id', protect, adminOnly, validateId(), asyncHandler(async (req, res) => {
  await Skill.findByIdAndDelete(req.params.id);
  res.json({ message: 'Skill deleted' });
}));

export default router;
