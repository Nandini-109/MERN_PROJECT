import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    exchange: { type: mongoose.Schema.Types.ObjectId, ref: 'ExchangeRequest', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', maxlength: 400, trim: true }
  },
  { timestamps: true }
);

// One review per person per exchange.
reviewSchema.index({ exchange: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, createdAt: -1 });

export default mongoose.model('Review', reviewSchema);
