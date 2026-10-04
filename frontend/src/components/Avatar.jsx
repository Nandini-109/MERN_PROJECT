import { avatarColor, initials } from '../lib/utils';

export default function Avatar({ user, size = 44, square = false }) {
  const name = user?.name || '?';
  return (
    <span className={`avatar ${square ? 'square' : ''}`} style={{ '--size': `${size}px`, background: user?.avatar ? undefined : avatarColor(name) }} aria-hidden="true">
      {user?.avatar ? <img src={user.avatar} alt="" loading="lazy" /> : initials(name)}
    </span>
  );
}
