import mongoose from 'mongoose';

const levelSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true, trim: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Intermediate' }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // ---- original fields (unchanged) ----
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    bio: { type: String, default: '', maxlength: 500 },
    location: { type: String, default: '', maxlength: 80 },
    teachSkills: [{ type: String, trim: true }],
    learnSkills: [{ type: String, trim: true }],
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // ---- new fields (all optional, safe defaults for existing users) ----
    headline: { type: String, default: '', maxlength: 100 },
    avatar: { type: String, default: '' }, // small data-URL image (resized in the browser)
    availability: [{ type: String, enum: ['Weekday mornings', 'Weekday evenings', 'Weekends', 'Flexible'] }],
    teachLevels: [levelSchema],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

userSchema.index({ teachSkills: 1 });
userSchema.index({ learnSkills: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.model('User', userSchema);
