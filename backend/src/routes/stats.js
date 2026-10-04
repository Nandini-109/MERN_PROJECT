import express from 'express';
import User from '../models/User.js';
import Skill from '../models/Skill.js';
import ExchangeRequest from '../models/ExchangeRequest.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler, counterpart, profileCompletion } from '../utils/helpers.js';

const router = express.Router();

// Public numbers for the landing page.
router.get('/public', asyncHandler(async (_req, res) => {
  const [members, skills, exchanges] = await Promise.all([
    User.countDocuments(),
    Skill.countDocuments(),
    ExchangeRequest.countDocuments({ status: { $in: ['accepted', 'completed'] } })
  ]);
  res.json({ members, skills, exchanges });
}));

router.get('/admin', protect, adminOnly, asyncHandler(async (_req, res) => {
  const [users, skills, requests, completed] = await Promise.all([
    User.countDocuments(),
    Skill.countDocuments(),
    ExchangeRequest.countDocuments(),
    ExchangeRequest.countDocuments({ status: 'completed' })
  ]);
  res.json({ users, skills, requests, completed });
}));

// Everything the dashboard needs in one request.
router.get('/dashboard', protect, asyncHandler(async (req, res) => {
  const me = req.user;
  const involved = { $or: [{ sender: me._id }, { receiver: me._id }] };
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 6);

  const [sent, receivedPending, active, completed, unreadMessages, unreadNotifications, recent, recentReqs, recentMsgs] =
    await Promise.all([
      ExchangeRequest.countDocuments({ sender: me._id }),
      ExchangeRequest.countDocuments({ receiver: me._id, status: 'pending' }),
      ExchangeRequest.countDocuments({ ...involved, status: 'accepted' }),
      ExchangeRequest.countDocuments({ ...involved, status: 'completed' }),
      Message.countDocuments({ receiver: me._id, readAt: null }),
      Notification.countDocuments({ user: me._id, read: false }),
      ExchangeRequest.find(involved).sort({ updatedAt: -1 }).limit(6)
        .populate('sender', 'name avatar').populate('receiver', 'name avatar'),
      ExchangeRequest.find({ ...involved, createdAt: { $gte: since } }).select('createdAt').lean(),
      Message.find({ $or: [{ sender: me._id }, { receiver: me._id }], createdAt: { $gte: since } }).select('createdAt').lean()
    ]);

  // Last 7 days of activity (requests + messages).
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    days.push({ key: d.toDateString(), label: d.toLocaleDateString('en-US', { weekday: 'short' }), count: 0 });
  }
  for (const item of [...recentReqs, ...recentMsgs]) {
    const day = days.find((d) => d.key === new Date(item.createdAt).toDateString());
    if (day) day.count += 1;
  }

  res.json({
    counts: {
      teach: (me.teachSkills || []).length,
      learn: (me.learnSkills || []).length,
      sent, receivedPending, active, completed,
      favorites: (me.favorites || []).length,
      unreadMessages, unreadNotifications
    },
    rating: { avg: me.ratingAvg || 0, count: me.ratingCount || 0 },
    completion: profileCompletion(me),
    activity: days.map(({ label, count }) => ({ label, count })),
    recent: recent.map((r) => {
      const { iAmSender, other } = counterpart(r, me._id);
      return {
        _id: r._id,
        status: r.status,
        direction: iAmSender ? 'sent' : 'received',
        other,
        skillOffered: r.skillOffered,
        skillWanted: r.skillWanted,
        updatedAt: r.updatedAt
      };
    })
  });
}));

export default router;
