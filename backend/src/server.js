import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import skillRoutes from './routes/skills.js';
import requestRoutes from './routes/requests.js';
import reviewRoutes from './routes/reviews.js';
import notificationRoutes from './routes/notifications.js';
import messageRoutes from './routes/messages.js';
import statsRoutes from './routes/stats.js';
import { notFound, errorHandler } from './middleware/error.js';

for (const key of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in backend/.env – copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}

const app = express();
const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((o) => o.trim());

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// Allowed origins from CLIENT_URL; in development any localhost port is also accepted
// (Vite moves to 5174, 5175… when 5173 is busy).
const devLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || origins.includes(origin) || (process.env.NODE_ENV !== 'production' && devLocalhost.test(origin)))
}));
app.use(express.json({ limit: '1mb' })); // profile photos are small, resized data-URLs

app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' }
}));

app.get('/api/health', (_req, res) => res.json({ message: 'SkillSwap API is running' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)));
