import { Link } from 'react-router-dom';
import { ArrowLeftRight, Clock, Heart, MapPin, Sparkles } from 'lucide-react';
import Avatar from './Avatar';
import { LearnChip, Stars, TeachChip } from './ui';

function MatchBanner({ match }) {
  if (!match) return null;
  if (match.mutual) {
    return <div className="match-banner"><ArrowLeftRight size={15} />Mutual match · {match.theyTeachMe[0]} ⇄ {match.iTeachThem[0]}</div>;
  }
  if (match.theyTeachMe.length) return <div className="match-banner soft"><Sparkles size={15} />Teaches {match.theyTeachMe[0]} – on your wish list</div>;
  if (match.iTeachThem.length) return <div className="match-banner soft"><Sparkles size={15} />Wants {match.iTeachThem[0]} – you can teach it</div>;
  return null;
}

export default function UserCard({ user, onRequest, onToggleFavorite }) {
  const teach = user.teachSkills || [];
  const learn = user.learnSkills || [];
  return (
    <article className="card hover user-card">
      <button className={`fav-btn ${user.isFavorite ? 'on' : ''}`} onClick={() => onToggleFavorite(user)} aria-pressed={!!user.isFavorite}
        aria-label={user.isFavorite ? `Remove ${user.name} from saved people` : `Save ${user.name}`}>
        <Heart size={19} />
      </button>

      <div className="user-card-top">
        <Avatar user={user} size={54} />
        <div className="grow" style={{ paddingRight: 34 }}>
          <h3 className="truncate"><Link to={`/u/${user._id}`}>{user.name}</Link></h3>
          <p className="sub truncate">{user.headline || 'SkillSwap member'}</p>
          <div style={{ marginTop: 6 }}><Stars value={user.ratingAvg || 0} count={user.ratingCount || 0} size={13} /></div>
        </div>
      </div>

      <MatchBanner match={user.match} />

      <div>
        <div className="card-section-title">Teaches</div>
        <div className="chips">
          {teach.length ? <>
            {teach.slice(0, 3).map((s) => <TeachChip key={s} user={user} skill={s} />)}
            {teach.length > 3 && <span className="chip">+{teach.length - 3}</span>}
          </> : <span className="muted small">Nothing listed yet</span>}
        </div>
      </div>

      <div>
        <div className="card-section-title">Wants to learn</div>
        <div className="chips">
          {learn.length ? <>
            {learn.slice(0, 3).map((s) => <LearnChip key={s} skill={s} />)}
            {learn.length > 3 && <span className="chip learn">+{learn.length - 3}</span>}
          </> : <span className="muted small">Open to anything</span>}
        </div>
      </div>

      <div className="row small muted" style={{ gap: 14 }}>
        {user.location && <span className="row" style={{ gap: 4 }}><MapPin size={14} />{user.location}</span>}
        {user.availability?.length > 0 && <span className="row" style={{ gap: 4 }}><Clock size={14} />{user.availability[0]}{user.availability.length > 1 ? ` +${user.availability.length - 1}` : ''}</span>}
      </div>

      <div className="actions">
        <button className="btn btn-primary btn-sm" onClick={() => onRequest(user)}><ArrowLeftRight size={16} />Request swap</button>
        <Link className="btn btn-secondary btn-sm" to={`/u/${user._id}`}>Profile</Link>
      </div>
    </article>
  );
}
