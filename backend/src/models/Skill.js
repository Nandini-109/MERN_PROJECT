import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: '' }
  },
  { timestamps: true }
);

skillSchema.index({ category: 1, name: 1 });

export default mongoose.model('Skill', skillSchema);
