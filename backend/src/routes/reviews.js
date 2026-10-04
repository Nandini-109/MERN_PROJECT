import express from 'express';
import Review from '../models/Review.js';
import ExchangeRequest from '../models/ExchangeRequest.js';
import User from '../models/User.js';
import { notify } from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, HttpError, validateId, isValidId } from '../utils/helpers.js';

const router = express.Router();

router.post('/', protect, asyncHandler(async (req, res) => {
  const { exchange, comment = '' } = req.body;
  const rating = Number(req.body.rating);
  if (!isValidId(exchange)) throw new HttpError(400, 'Invalid exchange');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'Rating must be between 1 and 5');

  const ex = await ExchangeRequest.findById(exchange);
  if (!ex) throw new HttpError(404, 'Exchange not found');
  const me = String(req.user._id);
  if (![String(ex.sender), String(ex.receiver)].includes(me)) throw new HttpError(403, 'You were not part of this exchange');
  if (ex.status !== 'completed') throw new HttpError(409, 'You can review an exchange once it is completed');

  const reviewee = String(ex.sender) === me ? ex.receiver : ex.sender;
  if (!(await User.exists({ _id: reviewee }))) throw new HttpError(409, 'This member has left SkillSwap, so they cannot be reviewed.');
  if (await Review.exists({ exchange, reviewer: req.user._id })) throw new HttpError(409, 'You already reviewed this exchange');

  const review = await Review.create({
    exchange, reviewer: req.user._id, reviewee, rating, comment: String(comment).trim().slice(0, 400)
  });

  const [agg] = await Review.aggregate([
    { $match: { reviewee } },
    { $group: { _id: '$reviewee', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  await User.findByIdAndUpdate(reviewee, {
    ratingAvg: Math.round((agg?.avg || rating) * 10) / 10,
    ratingCount: agg?.count || 1
  });
  await notify(reviewee, 'review', `${req.user.name} left you a ${rating}-star review`, `/u/${req.user._id}`);
  res.status(201).json(review);
}));

router.get('/user/:id', protect, validateId(), asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewee: req.params.id })
    .sort({ createdAt: -1 }).limit(50).populate('reviewer', 'name avatar');
  res.json(reviews);
}));

export default router;
