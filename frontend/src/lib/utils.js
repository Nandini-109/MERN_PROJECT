export const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
export const AVAILABILITY = ['Weekday mornings', 'Weekday evenings', 'Weekends', 'Flexible'];

export function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export const timeOnly = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
export const dayLabel = (d) => {
  const date = new Date(d);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  const y = new Date(); y.setDate(today.getDate() - 1);
  if (date.toDateString() === y.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const initials = (name = '?') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';

// Calm, deterministic avatar colours (no neon).
const AVATAR_COLORS = ['#2a3558', '#3b4a7a', '#5a4a78', '#35655f', '#7a5a3b', '#6b3f55', '#3f5f7a', '#55623b'];
export function avatarColor(name = '') {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function levelOf(user, skill) {
  return user?.teachLevels?.find((l) => l.skill.toLowerCase() === skill.toLowerCase())?.level || 'Intermediate';
}

export function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export const CATEGORY_ICONS = {
  Programming: 'Code2', Design: 'Palette', 'Data & AI': 'BarChart3', Languages: 'Languages',
  'Music & Arts': 'Music', Business: 'Briefcase', Lifestyle: 'Leaf'
};

/** Resize + centre-crop an image file to a small square JPEG data-URL (keeps requests tiny). */
export function fileToAvatar(file, size = 256) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That image could not be opened'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const s = Math.min(img.width, img.height);
        canvas.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ---- Recently viewed profiles (stored locally, per browser) ----
const RECENT_KEY = 'skillswap_recent';
export const getRecent = () => {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY));
    return Array.isArray(list) ? list.filter((r) => r && r._id && r.name) : [];
  } catch { return []; }
};
export function addRecent(u) {
  const item = { _id: u._id, name: u.name, headline: u.headline || '', avatar: u.avatar || '' };
  const list = [item, ...getRecent().filter((r) => r._id !== u._id)].slice(0, 5);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* storage full – ignore */ }
}

/** A member that no longer exists comes from the API as `{ deleted: true, name: 'Deleted member' }`. */
export const isGone = (person) => !person || !!person.deleted;
export const displayName = (person) => person?.name || 'Deleted member';
