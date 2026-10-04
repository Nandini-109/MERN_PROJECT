import express from 'express';
import ExchangeRequest from '../models/ExchangeRequest.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import { notify } from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, DELETED_MEMBER, HttpError, validateId, isValidId } from '../utils/helpers.js';

const router = express.Router();
const PERSON = 'name email avatar headline teachSkills learnSkills ratingAvg ratingCount';

// Adds `reviewed` (did I already review this exchange?) to each request.
async function withReviewFlags(requests, meId) {
  const ids = requests.filter((r) => r.status === 'completed').map((r) => r._id);
  const mine = ids.length ? await Review.find({ exchange: { $in: ids }, reviewer: meId }).select('exchange').lean() : [];
  const done = new Set(mine.map((r) => String(r.exchange)));
  return requests.map((r) => {
    const o = r.toObject();
    // Deleted members populate as null – expose an explicit placeholder instead.
    if (!o.sender) o.sender = { ...DELETED_MEMBER };
    if (!o.receiver) o.receiver = { ...DELETED_MEMBER };
    return { ...o, reviewed: done.has(String(r._id)) };
  });
}

router.post('/', protect, asyncHandler(async (req, res) => {
  const { receiver, message = '' } = req.body;
  const skillOffered = String(req.body.skillOffered || '').trim();
  const skillWanted = String(req.body.skillWanted || '').trim();

  if (!receiver || !skillOffered || !skillWanted) throw new HttpError(400, 'Receiver and skills are required');
  if (!isValidId(receiver)) throw new HttpError(400, 'Invalid receiver');
  if (String(receiver) === String(req.user._id)) throw new HttpError(400, 'You cannot request yourself');
  const target = await User.findById(receiver);
  if (!target) throw new HttpError(404, 'Receiver not found');

  const existing = await ExchangeRequest.findOne({
    sender: req.user._id, receiver, skillOffered, skillWanted, status: 'pending'
  });
  if (existing) throw new HttpError(409, 'A similar request is already pending');

  const request = await ExchangeRequest.create({
    sender: req.user._id, receiver, skillOffered, skillWanted, message: String(message).trim().slice(0, 500)
  });
  await notify(receiver, 'request', `${req.user.name} wants to swap ${skillOffered} for ${skillWanted}`, '/requests');

  res.status(201).json(await request.populate([
    { path: 'sender', select: 'name email' },
    { path: 'receiver', select: 'name email' }
  ]));
}));

router.get('/mine', protect, asyncHandler(async (req, res) => {
  const [sent, received] = await Promise.all([
    ExchangeRequest.find({ sender: req.user._id }).populate('receiver', PERSON).sort({ createdAt: -1 }),
    ExchangeRequest.find({ receiver: req.user._id }).populate('sender', PERSON).sort({ createdAt: -1 })
  ]);
  res.json({
    sent: await withReviewFlags(sent, req.user._id),
    received: await withReviewFlags(received, req.user._id)
  });
}));

router.patch('/:id', protect, validateId(), asyncHandler(async (req, res) => {
  const request = await ExchangeRequest.findById(req.params.id);
  if (!request) throw new HttpError(404, 'Request not found');

  const { status } = req.body;
  const me = String(req.user._id);
  const isReceiver = String(request.receiver) === me;
  const isSender = String(request.sender) === me;
  const otherId = isReceiver ? request.sender : request.receiver;
  if (['accepted', 'completed'].includes(status) && !(await User.exists({ _id: otherId }))) {
    throw new HttpError(409, 'This member has left SkillSwap, so the request can no longer be updated.');
  }

  if (['accepted', 'rejected'].includes(status)) {
    if (!isReceiver) throw new HttpError(403, 'Only the receiver can update this request');
    if (request.status !== 'pending') throw new HttpError(409, `This request is already ${request.status}`);
  } else if (status === 'cancelled') {
    if (!isSender) throw new HttpError(403, 'Only the sender can cancel this request');
    if (request.status !== 'pending') throw new HttpError(409, 'Only pending requests can be cancelled');
  } else if (status === 'completed') {
    if (!isSender && !isReceiver) throw new HttpError(403, 'You are not part of this exchange');
    if (request.status !== 'accepted') throw new HttpError(409, 'Only accepted exchanges can be completed');
    request.completedAt = new Date();
  } else {
    throw new HttpError(400, 'Invalid status');
  }

  request.status = status;
  await request.save();

  const texts = {
    accepted: [`${req.user.name} accepted your swap request`, '/requests'],
    rejected: [`${req.user.name} declined your swap request`, '/requests'],
    completed: [`${req.user.name} marked your exchange as completed – leave a review!`, '/requests'],
    cancelled: [`${req.user.name} cancelled a swap request`, '/requests']
  };
  await notify(otherId, status === 'cancelled' ? 'info' : status, ...texts[status]);
  res.json(request);
}));

export default router;
