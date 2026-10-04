import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skillOffered: { type: String, required: true, trim: true, maxlength: 60 },
    skillWanted: { type: String, required: true, trim: true, maxlength: 60 },
    message: { type: String, default: '', maxlength: 500 },
    // 'completed' and 'cancelled' are new; the original three keep working.
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending'
    },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

requestSchema.index({ sender: 1, createdAt: -1 });
requestSchema.index({ receiver: 1, createdAt: -1 });

export default mongoose.model('ExchangeRequest', requestSchema);
