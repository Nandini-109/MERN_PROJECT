/**
 * Seed script
 *   npm run seed         -> adds the skill catalogue (safe to re-run, never deletes anything)
 *   npm run seed:demo    -> catalogue + demo members, exchanges, reviews and chats
 *   npm run seed:reset   -> removes previous demo data first, then re-creates it
 *
 * Demo logins (password for all members: Demo@123)
 *   riya@skillswap.demo   – member with a full dashboard (best for presentations)
 *   admin@skillswap.demo  – admin account (password: Admin@123)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Skill from './models/Skill.js';
import ExchangeRequest from './models/ExchangeRequest.js';
import Review from './models/Review.js';
import Message from './models/Message.js';
import Notification from './models/Notification.js';

const CATALOGUE = {
  'Programming': ['Python', 'JavaScript', 'React', 'Node.js', 'Java', 'SQL', 'C++', 'Git & GitHub'],
  'Design': ['UI/UX Design', 'Figma', 'Graphic Design', 'Photoshop', 'Video Editing'],
  'Data & AI': ['Data Analysis', 'Machine Learning', 'Excel', 'Power BI'],
  'Languages': ['English Speaking', 'Hindi', 'French', 'Spanish', 'German'],
  'Music & Arts': ['Guitar', 'Piano', 'Singing', 'Sketching', 'Photography'],
  'Business': ['Public Speaking', 'Digital Marketing', 'Content Writing', 'Financial Literacy', 'Resume Building'],
  'Lifestyle': ['Yoga', 'Cooking', 'Chess', 'Fitness Training']
};

const DEMO_DOMAIN = '@skillswap.demo';
const lv = (pairs) => pairs.map(([skill, level]) => ({ skill, level }));

const PEOPLE = [
  { name: 'Riya Sharma', email: 'riya', headline: 'BScIT student · Python tutor', location: 'Mumbai',
    bio: 'Third-year IT student who loves automating boring things with Python. Looking to get better at design and public speaking.',
    teach: lv([['Python', 'Advanced'], ['SQL', 'Intermediate'], ['Data Analysis', 'Intermediate']]),
    learn: ['UI/UX Design', 'Public Speaking', 'Guitar'], availability: ['Weekday evenings', 'Weekends'] },
  { name: 'Kabir Mehta', email: 'kabir', headline: 'Product designer · Figma nerd', location: 'Mumbai',
    bio: 'I design apps for a living and enjoy teaching design thinking. Want to learn how to code my own prototypes.',
    teach: lv([['UI/UX Design', 'Expert'], ['Figma', 'Expert'], ['Graphic Design', 'Advanced']]),
    learn: ['Python', 'JavaScript'], availability: ['Weekday evenings'] },
  { name: 'Ananya Iyer', email: 'ananya', headline: 'Classical vocalist & guitarist', location: 'Pune',
    bio: 'Ten years of music training. Happy to teach vocals and guitar basics in exchange for help with Excel and data skills.',
    teach: lv([['Singing', 'Expert'], ['Guitar', 'Advanced'], ['Piano', 'Intermediate']]),
    learn: ['Excel', 'Data Analysis'], availability: ['Weekends'] },
  { name: 'Rohan Desai', email: 'rohan', headline: 'Full-stack developer', location: 'Bengaluru',
    bio: 'MERN developer at a fintech startup. I mentor juniors on React and Node and want to improve my spoken English.',
    teach: lv([['React', 'Expert'], ['Node.js', 'Advanced'], ['JavaScript', 'Expert'], ['Git & GitHub', 'Advanced']]),
    learn: ['English Speaking', 'Public Speaking'], availability: ['Weekday mornings', 'Weekends'] },
  { name: 'Meera Nair', email: 'meera', headline: 'Spoken English coach', location: 'Kochi',
    bio: 'Certified English trainer. I help people speak with confidence and want to learn practical programming.',
    teach: lv([['English Speaking', 'Expert'], ['Public Speaking', 'Advanced'], ['Resume Building', 'Advanced']]),
    learn: ['Python', 'Excel'], availability: ['Weekday mornings', 'Flexible'] },
  { name: 'Arjun Patel', email: 'arjun', headline: 'Data analyst · Power BI', location: 'Ahmedabad',
    bio: 'I turn messy spreadsheets into dashboards. Looking for someone to help me with machine learning basics.',
    teach: lv([['Power BI', 'Advanced'], ['Excel', 'Expert'], ['SQL', 'Advanced']]),
    learn: ['Machine Learning', 'Python'], availability: ['Weekday evenings', 'Weekends'] },
  { name: 'Sara Khan', email: 'sara', headline: 'Photographer & video editor', location: 'Mumbai',
    bio: 'Wedding and street photographer. I can teach composition, lighting and editing — keen to learn digital marketing.',
    teach: lv([['Photography', 'Expert'], ['Video Editing', 'Advanced'], ['Photoshop', 'Advanced']]),
    learn: ['Digital Marketing', 'Content Writing'], availability: ['Weekends', 'Weekday evenings'] },
  { name: 'Vikram Rao', email: 'vikram', headline: 'ML engineer', location: 'Hyderabad',
    bio: 'Working on computer-vision models. Teaching ML fundamentals is my favourite hobby; I would love to learn the guitar.',
    teach: lv([['Machine Learning', 'Expert'], ['Python', 'Expert'], ['Data Analysis', 'Advanced']]),
    learn: ['Guitar', 'Photography'], availability: ['Weekday evenings'] },
  { name: 'Neha Kulkarni', email: 'neha', headline: 'Marketing strategist', location: 'Pune',
    bio: 'I run social media campaigns for small brands. Can teach SEO, content and analytics; want to learn UI design.',
    teach: lv([['Digital Marketing', 'Expert'], ['Content Writing', 'Advanced']]),
    learn: ['UI/UX Design', 'Photography'], availability: ['Flexible'] },
  { name: 'Dev Malhotra', email: 'dev', headline: 'Chess coach · Fitness enthusiast', location: 'Delhi',
    bio: 'Rated 1900 on chess platforms and a weekend marathoner. Let us trade chess strategy for coding help.',
    teach: lv([['Chess', 'Expert'], ['Fitness Training', 'Intermediate']]),
    learn: ['JavaScript', 'Python'], availability: ['Weekends'] },
  { name: 'Isha Verma', email: 'isha', headline: 'Yoga instructor', location: 'Rishikesh',
    bio: 'Teaching yoga and mindful cooking for six years. Looking to build a simple website for my classes.',
    teach: lv([['Yoga', 'Expert'], ['Cooking', 'Advanced']]),
    learn: ['React', 'Graphic Design'], availability: ['Weekday mornings'] },
  { name: 'Tanvi Joshi', email: 'tanvi', headline: 'Language lover · French & German', location: 'Mumbai',
    bio: 'Studied abroad and picked up French and German. Happy to swap language lessons for finance basics.',
    teach: lv([['French', 'Advanced'], ['German', 'Intermediate']]),
    learn: ['Financial Literacy', 'Sketching'], availability: ['Weekday evenings', 'Weekends'] }
];

async function seedSkills() {
  let created = 0;
  for (const [category, names] of Object.entries(CATALOGUE)) {
    for (const name of names) {
      const res = await Skill.updateOne({ name }, { $setOnInsert: { name, category, description: `Learn and teach ${name}` } }, { upsert: true });
      if (res.upsertedCount) created += 1;
    }
  }
  console.log(`Skills: ${created} added, ${Object.values(CATALOGUE).flat().length - created} already present`);
}

async function removeDemo() {
  const demo = await User.find({ email: new RegExp(`${DEMO_DOMAIN.replace('.', '\\.')}$`) }).select('_id');
  const ids = demo.map((u) => u._id);
  const ex = await ExchangeRequest.find({ $or: [{ sender: { $in: ids } }, { receiver: { $in: ids } }] }).select('_id');
  await Promise.all([
    Message.deleteMany({ exchange: { $in: ex.map((e) => e._id) } }),
    Review.deleteMany({ $or: [{ reviewer: { $in: ids } }, { reviewee: { $in: ids } }] }),
    Notification.deleteMany({ user: { $in: ids } }),
    ExchangeRequest.deleteMany({ _id: { $in: ex.map((e) => e._id) } }),
    User.deleteMany({ _id: { $in: ids } })
  ]);
  console.log(`Removed ${ids.length} demo users and their data`);
}

async function seedDemo() {
  const hash = await bcrypt.hash('Demo@123', 10);
  const users = {};
  for (const p of PEOPLE) {
    const email = `${p.email}${DEMO_DOMAIN}`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: p.name, email, password: hash, bio: p.bio, headline: p.headline, location: p.location,
        teachSkills: p.teach.map((t) => t.skill), teachLevels: p.teach, learnSkills: p.learn, availability: p.availability
      });
    }
    users[p.email] = user;
  }
  if (!(await User.findOne({ email: `admin${DEMO_DOMAIN}` }))) {
    await User.create({
      name: 'SkillSwap Admin', email: `admin${DEMO_DOMAIN}`, password: await bcrypt.hash('Admin@123', 10),
      role: 'admin', headline: 'Platform administrator'
    });
  }

  if (await ExchangeRequest.exists({ sender: users.riya._id, skillOffered: 'Python', skillWanted: 'UI/UX Design' })) {
    console.log('Demo exchanges already exist – skipping exchange/chat/review seed');
    return;
  }

  const day = 86400000;
  const mk = async (from, to, offered, wanted, status, message, ago) => {
    const createdAt = new Date(Date.now() - ago * day);
    const doc = await ExchangeRequest.create({
      sender: users[from]._id, receiver: users[to]._id, skillOffered: offered, skillWanted: wanted, status, message,
      completedAt: status === 'completed' ? new Date(createdAt.getTime() + 2 * day) : undefined
    });
    await ExchangeRequest.collection.updateOne({ _id: doc._id }, { $set: { createdAt, updatedAt: new Date(createdAt.getTime() + day) } });
    return doc;
  };

  const e1 = await mk('riya', 'kabir', 'Python', 'UI/UX Design', 'completed', 'Hi Kabir! I can teach you Python from scratch if you can walk me through Figma.', 12);
  const e2 = await mk('rohan', 'riya', 'React', 'Python', 'accepted', 'Would love to learn Python basics – happy to teach you React hooks in return.', 5);
  await mk('arjun', 'riya', 'Excel', 'Data Analysis', 'pending', 'Hey Riya, could we swap advanced Excel for data analysis tips?', 1);
  await mk('riya', 'ananya', 'SQL', 'Guitar', 'pending', 'I can teach SQL on weekends – interested in guitar basics!', 2);
  await mk('riya', 'meera', 'Python', 'Public Speaking', 'rejected', 'Looking to practise presentations before my viva.', 9);
  const e6 = await mk('vikram', 'arjun', 'Machine Learning', 'Power BI', 'completed', 'Let us swap ML basics for dashboards!', 20);
  const e7 = await mk('sara', 'neha', 'Photography', 'Digital Marketing', 'completed', 'Photography lessons for marketing strategy?', 15);

  const msgs = [
    [e2, 'rohan', 'riya', 'Hi Riya! When are you free for our first session?', 4],
    [e2, 'riya', 'rohan', 'Hey Rohan! Saturday 5pm works. Should we start with Python functions?', 4],
    [e2, 'rohan', 'riya', 'Perfect. I will share a short React roadmap before we meet.', 3],
    [e1, 'kabir', 'riya', 'Thanks for the Python sessions – my first script worked!', 8],
    [e1, 'riya', 'kabir', 'Amazing! And your Figma tips made my project look so much better.', 8]
  ];
  for (const [ex, from, to, text, ago] of msgs) {
    const m = await Message.create({ exchange: ex._id, sender: users[from]._id, receiver: users[to]._id, text, readAt: from === 'riya' || ago > 3 ? new Date() : null });
    await Message.collection.updateOne({ _id: m._id }, { $set: { createdAt: new Date(Date.now() - ago * day) } });
  }

  const reviews = [
    [e1, 'kabir', 'riya', 5, 'Patient, clear and well prepared. Python finally makes sense!'],
    [e1, 'riya', 'kabir', 5, 'Kabir explained design thinking brilliantly. Highly recommended.'],
    [e6, 'arjun', 'vikram', 5, 'Great ML fundamentals session with real examples.'],
    [e6, 'vikram', 'arjun', 4, 'Power BI tips saved me hours.'],
    [e7, 'neha', 'sara', 5, 'Sara\'s lighting lessons transformed my product shots.'],
    [e7, 'sara', 'neha', 4, 'Very practical marketing advice.']
  ];
  for (const [ex, from, to, rating, comment] of reviews) {
    await Review.create({ exchange: ex._id, reviewer: users[from]._id, reviewee: users[to]._id, rating, comment });
  }
  for (const u of Object.values(users)) {
    const [agg] = await Review.aggregate([{ $match: { reviewee: u._id } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]);
    if (agg) await User.updateOne({ _id: u._id }, { ratingAvg: Math.round(agg.avg * 10) / 10, ratingCount: agg.n });
  }

  await User.updateOne({ _id: users.riya._id }, { favorites: [users.kabir._id, users.neha._id, users.ananya._id] });
  await Notification.insertMany([
    { user: users.riya._id, type: 'request', text: 'Arjun Patel wants to swap Excel for Data Analysis', link: '/requests' },
    { user: users.riya._id, type: 'accepted', text: 'Rohan Desai accepted your swap request', link: '/requests', read: true },
    { user: users.riya._id, type: 'review', text: 'Kabir Mehta left you a 5-star review', link: `/u/${users.riya._id}`, read: true }
  ]);
  console.log('Demo members, exchanges, chats and reviews created');
}

try {
  await mongoose.connect(process.env.MONGO_URI);
  const args = process.argv.slice(2);
  if (args.includes('--reset')) await removeDemo();
  await seedSkills();
  if (args.includes('--demo')) await seedDemo();
  console.log('Done.');
} catch (e) {
  console.error('Seed failed:', e.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
