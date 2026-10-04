import express from 'express';
import ExchangeRequest from '../models/ExchangeRequest.js';
import Message from '../models/Message.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, counterpart, HttpError, validateId } from '../utils/helpers.js';

const router = express.Router();
router.use(protect);

const CHAT_STATUSES = ['accepted', 'completed'];
const PERSON = 'name avatar headline';

// Loads an exchange and makes sure the current user is allowed to chat in it.
async function loadChat(exchangeId, user) {
  const ex = await ExchangeRequest.findById(exchangeId).populate('sender', PERSON).populate('receiver', PERSON);
  if (!ex) throw new HttpError(404, 'Conversation not found');
  const me = String(user._id);
  const isParty = [ex.sender, ex.receiver].some((p) => p && String(p._id) === me);
  if (!isParty) throw new HttpError(403, 'This conversation is private');
  if (!ex.sender || !ex.receiver) throw new HttpError(410, 'This member has left SkillSwap, so the chat is closed.');
  if (!CHAT_STATUSES.includes(ex.status)) throw new HttpError(409, 'Chat opens once the request is accepted');
  const { other } = counterpart(ex, me);
  return { ex, other };
}

router.get('/conversations', asyncHandler(async (req, res) => {
  const me = req.user._id;
  const exchanges = await ExchangeRequest.find({
    status: { $in: CHAT_STATUSES }, $or: [{ sender: me }, { receiver: me }]
  }).populate('sender', PERSON).populate('receiver', PERSON).sort({ updatedAt: -1 });

  const stats = await Message.aggregate([
    { $match: { exchange: { $in: exchanges.map((e) => e._id) } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$exchange',
        last: { $first: '$$ROOT' },
        unread: { $sum: { $cond: [{ $and: [{ $eq: ['$receiver', me] }, { $eq: ['$readAt', null] }] }, 1, 0] } }
      }
    }
  ]);
  const byExchange = new Map(stats.map((s) => [String(s._id), s]));

  // A chat needs two existing members – threads with a deleted member are closed and not listed.
  const list = exchanges.filter((e) => e.sender && e.receiver).map((e) => {
    const s = byExchange.get(String(e._id));
    return {
      _id: e._id,
      status: e.status,
      skillOffered: e.skillOffered,
      skillWanted: e.skillWanted,
      other: counterpart(e, me).other,
      lastMessage: s ? { text: s.last.text, createdAt: s.last.createdAt, mine: String(s.last.sender) === String(me) } : null,
      unread: s?.unread || 0
    };
  });
  list.sort((a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0));
  res.json(list);
}));

router.get('/unread-count', asyncHandler(async (req, res) => {
  res.json({ unread: await Message.countDocuments({ receiver: req.user._id, readAt: null }) });
}));

router.get('/:exchangeId', validateId('exchangeId'), asyncHandler(async (req, res) => {
  const { ex, other } = await loadChat(req.params.exchangeId, req.user);
  const messages = await Message.find({ exchange: ex._id }).sort({ createdAt: -1 }).limit(200);
  await Message.updateMany({ exchange: ex._id, receiver: req.user._id, readAt: null }, { readAt: new Date() });
  res.json({
    exchange: { _id: ex._id, status: ex.status, skillOffered: ex.skillOffered, skillWanted: ex.skillWanted, other },
    messages: messages.reverse()
  });
}));

router.post('/:exchangeId', validateId('exchangeId'), asyncHandler(async (req, res) => {
  const text = String(req.body.text || '').trim();
  if (!text) throw new HttpError(400, 'Message cannot be empty');
  const { ex, other } = await loadChat(req.params.exchangeId, req.user);
  const message = await Message.create({
    exchange: ex._id, sender: req.user._id, receiver: other._id, text: text.slice(0, 1000)
  });
  res.status(201).json(message);
}));

export default router;
