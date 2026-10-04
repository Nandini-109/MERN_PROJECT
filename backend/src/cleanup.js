/**
 * Finds (and optionally removes) orphaned data left behind by deleted users.
 *   npm run cleanup        -> report only, nothing is changed
 *   npm run cleanup:fix    -> delete the orphans
 * Older versions of the admin "delete user" action did not remove a user's requests,
 * messages, reviews or notifications, so existing databases may contain such records.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import ExchangeRequest from './models/ExchangeRequest.js';
import Message from './models/Message.js';
import Review from './models/Review.js';
import Notification from './models/Notification.js';

const fix = process.argv.includes('--fix');

try {
  await mongoose.connect(process.env.MONGO_URI);
  const userIds = new Set((await User.find().select('_id').lean()).map((u) => String(u._id)));
  const gone = (id) => !id || !userIds.has(String(id));

  const requests = await ExchangeRequest.find().select('sender receiver').lean();
  const badReq = requests.filter((r) => gone(r.sender) || gone(r.receiver)).map((r) => r._id);
  const goodReqIds = new Set(requests.filter((r) => !badReq.some((b) => String(b) === String(r._id))).map((r) => String(r._id)));

  const messages = await Message.find().select('exchange sender receiver').lean();
  const badMsg = messages.filter((m) => !goodReqIds.has(String(m.exchange)) || gone(m.sender) || gone(m.receiver)).map((m) => m._id);

  const reviews = await Review.find().select('exchange reviewer reviewee').lean();
  const badRev = reviews.filter((r) => !goodReqIds.has(String(r.exchange)) || gone(r.reviewer) || gone(r.reviewee)).map((r) => r._id);

  const notifs = await Notification.find().select('user').lean();
  const badNotif = notifs.filter((n) => gone(n.user)).map((n) => n._id);

  const staleFavs = await User.countDocuments({ favorites: { $exists: true, $ne: [] } });

  console.log(`Orphaned swap requests : ${badReq.length}`);
  console.log(`Orphaned messages      : ${badMsg.length}`);
  console.log(`Orphaned reviews       : ${badRev.length}`);
  console.log(`Orphaned notifications : ${badNotif.length}`);

  if (!fix) {
    console.log('\nDry run – nothing was changed. Re-run with "npm run cleanup:fix" to delete these records.');
  } else {
    await Promise.all([
      ExchangeRequest.deleteMany({ _id: { $in: badReq } }),
      Message.deleteMany({ _id: { $in: badMsg } }),
      Review.deleteMany({ _id: { $in: badRev } }),
      Notification.deleteMany({ _id: { $in: badNotif } })
    ]);
    // Drop favourites that point at deleted members.
    if (staleFavs) await User.updateMany({}, { $pull: { favorites: { $nin: [...userIds].map((i) => new mongoose.Types.ObjectId(i)) } } });
    console.log('\nOrphaned records removed.');
  }
} catch (e) {
  console.error('Cleanup failed:', e.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
