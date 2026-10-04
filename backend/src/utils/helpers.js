import mongoose from 'mongoose';

/** Wraps async route handlers so rejected promises reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Error with an HTTP status – thrown inside handlers, formatted by errorHandler. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const isValidId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/** Express middleware: rejects malformed ObjectIds in :params with a 400. */
export const validateId = (param = 'id') => (req, _res, next) =>
  isValidId(req.params[param]) ? next() : next(new HttpError(400, 'Invalid id'));

export const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
export const AVAILABILITY = ['Weekday mornings', 'Weekday evenings', 'Weekends', 'Flexible'];

/** Trim, drop empties, de-duplicate (case-insensitive), cap length and count. */
export function cleanList(list, { max = 20, maxLen = 40 } = {}) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const value = String(raw ?? '').trim().slice(0, maxLen);
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= max) break;
  }
  return out;
}

/** Keeps skill levels only for skills that exist in the given list. */
export function cleanLevels(levels, skills) {
  if (!Array.isArray(levels)) return [];
  const byName = new Map(skills.map((s) => [s.toLowerCase(), s]));
  const seen = new Set();
  const out = [];
  for (const item of levels) {
    const name = byName.get(String(item?.skill ?? '').trim().toLowerCase());
    if (!name || seen.has(name) || !LEVELS.includes(item?.level)) continue;
    seen.add(name);
    out.push({ skill: name, level: item.level });
  }
  return out;
}

/** Profile completion (0-100) plus the list of missing steps. */
export function profileCompletion(user) {
  const steps = [
    ['Add a profile photo', !!user.avatar],
    ['Write a short headline', !!user.headline],
    ['Add a bio (30+ characters)', (user.bio || '').trim().length >= 30],
    ['Add your location', !!user.location],
    ['Offer at least one skill', (user.teachSkills || []).length > 0],
    ['Request at least one skill', (user.learnSkills || []).length > 0],
    ['Set your availability', (user.availability || []).length > 0]
  ];
  const done = steps.filter(([, ok]) => ok).length;
  return {
    percent: Math.round((done / steps.length) * 100),
    missing: steps.filter(([, ok]) => !ok).map(([label]) => label)
  };
}

const norm = (s) => String(s).trim().toLowerCase();

/** How well two people fit: what they can teach me / what I can teach them. */
export function matchBetween(me, other) {
  const myLearn = new Set((me.learnSkills || []).map(norm));
  const myTeach = new Set((me.teachSkills || []).map(norm));
  const theyTeachMe = (other.teachSkills || []).filter((s) => myLearn.has(norm(s)));
  const iTeachThem = (other.learnSkills || []).filter((s) => myTeach.has(norm(s)));
  const mutual = theyTeachMe.length > 0 && iTeachThem.length > 0;
  return {
    theyTeachMe,
    iTeachThem,
    mutual,
    score: theyTeachMe.length * 2 + iTeachThem.length * 2 + (mutual ? 4 : 0)
  };
}

/** Public-safe user shape (never includes password, email or favorites). */
export function publicUser(u, extra = {}) {
  const o = typeof u.toObject === 'function' ? u.toObject() : u;
  // eslint-disable-next-line no-unused-vars
  const { password, email, favorites, __v, ...rest } = o;
  return { ...rest, ...extra };
}

/**
 * Stand-in for a member whose account no longer exists. Mongoose `populate()` yields `null`
 * for deleted users (e.g. requests created before deletes cascaded), so we return this
 * explicit, flagged object instead of letting `null` reach the client.
 */
export const DELETED_MEMBER = Object.freeze({
  _id: null, name: 'Deleted member', headline: '', avatar: '', teachSkills: [], learnSkills: [], deleted: true
});

/** Given a request with populated sender/receiver, returns who the "other" person is. Null-safe. */
export function counterpart(request, meId) {
  const iAmSender = !!request.sender && String(request.sender._id) === String(meId);
  const other = iAmSender ? request.receiver : request.sender;
  return { iAmSender, other: other || { ...DELETED_MEMBER } };
}
