import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    exchange: { type: mongoose.Schema.Types.ObjectId, ref: 'ExchangeRequest', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

messageSchema.index({ exchange: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, readAt: 1 });

export default mongoose.model('Message', messageSchema);
