import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['request', 'accepted', 'rejected', 'completed', 'review', 'info'], default: 'info' },
    text: { type: String, required: true, maxlength: 200 },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);

/** Fire-and-forget helper – a failed notification must never break the main action. */
export async function notify(user, type, text, link = '') {
  try {
    await mongoose.model('Notification').create({ user, type, text, link });
  } catch (e) {
    console.error('Notification failed:', e.message);
  }
}
