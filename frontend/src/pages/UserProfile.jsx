import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftRight, CalendarClock, CheckCircle2, Heart, MapPin, MessageSquare, Pencil, Sparkles, UserX } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/FeedbackContext';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Avatar from '../components/Avatar';
import RequestModal from '../components/RequestModal';
import { EmptyState, ErrorState, LearnChip, LevelDot, Skeleton, Stars } from '../components/ui';
import { addRecent, timeAgo } from '../lib/utils';

export default function UserProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const toast = useToast();
  const { data: u, loading, error, reload, setData } = useAsync(() => api.get(`/users/${id}`).then((r) => r.data), [id]);
  const [requesting, setRequesting] = useState(false);
  const isMe = me.id === id;
  useDocumentTitle(u?.name);

  useEffect(() => { if (u && !isMe) addRecent(u); }, [u, isMe]);

  async function toggleFavorite() {
    const before = u.isFavorite;
    setData((d) => ({ ...d, isFavorite: !before }));
    try {
      const { data } = await api.post(`/users/${id}/favorite`);
      setData((d) => ({ ...d, isFavorite: data.isFavorite }));
      toast.success(data.isFavorite ? `${u.name} saved` : `${u.name} removed from saved`);
    } catch (e) { setData((d) => ({ ...d, isFavorite: before })); toast.error(errMsg(e)); }
  }

  if (loading) return <div className="container page"><Skeleton h={230} r={20} /><div className="grid grid-2" style={{ marginTop: 20 }}><Skeleton h={260} r={20} /><Skeleton h={260} r={20} /></div></div>;
  if (error) {
    return (
      <div className="container page">
        <h1 className="sr-only">Profile unavailable</h1>
        {/does not exist|Invalid id|not found/i.test(error)
          ? <EmptyState icon={UserX} title="Profile not found" action={<Link to="/discover" className="btn btn-primary">Back to Discover</Link>}>This member may have left SkillSwap.</EmptyState>
          : <ErrorState message={error} onRetry={reload} />}
      </div>
    );
  }

  const match = u.match;
  const hasMatch = !isMe && (match.theyTeachMe.length > 0 || match.iTeachThem.length > 0);

  return (
    <div className="container page">
      <section className="card profile-head">
        <div className="profile-cover" />
        <div className="profile-body">
          <Avatar user={u} size={104} />
          <div className="profile-meta">
            <h1>{u.name}</h1>
            <p className="text-2">{u.headline || 'SkillSwap member'}</p>
            <div className="facts">
              {u.location && <span><MapPin size={15} />{u.location}</span>}
              <span><CheckCircle2 size={15} />{u.completedExchanges} completed swap{u.completedExchanges === 1 ? '' : 's'}</span>
              <span><CalendarClock size={15} />Joined {new Date(u.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
            </div>
            <div style={{ marginTop: 10 }}><Stars value={u.ratingAvg || 0} count={u.ratingCount || 0} /></div>
          </div>
          <div className="profile-actions">
            {isMe ? <Link to="/profile" className="btn btn-dark"><Pencil size={16} />Edit profile</Link> : (
              <>
                <button className="btn btn-primary" onClick={() => setRequesting(true)}><ArrowLeftRight size={17} />Request swap</button>
                {u.sharedExchangeId && <Link to={`/messages/${u.sharedExchangeId}`} className="btn btn-secondary"><MessageSquare size={17} />Message</Link>}
                <button className="btn btn-secondary" onClick={toggleFavorite} aria-pressed={u.isFavorite}>
                  <Heart size={17} fill={u.isFavorite ? 'var(--rose)' : 'none'} color={u.isFavorite ? 'var(--rose)' : 'currentColor'} />{u.isFavorite ? 'Saved' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="split">
        <div className="stack" style={{ gap: 20 }}>
          <section className="card">
            <div className="card-head"><h3>About</h3></div>
            <p className="text-2" style={{ whiteSpace: 'pre-wrap' }}>{u.bio || 'This member hasn’t written a bio yet.'}</p>
          </section>

          <section className="card">
            <div className="card-head"><h3>Skills offered</h3></div>
            <div className="stack" style={{ gap: 8 }}>
              {u.teachSkills?.length ? u.teachSkills.map((s) => {
                const level = u.teachLevels?.find((l) => l.skill.toLowerCase() === s.toLowerCase())?.level || 'Intermediate';
                return <div className="skill-row" key={s}><LevelDot level={level} /><b>{s}</b><span className="level-text">{level}</span></div>;
              }) : <p className="muted small">No skills listed yet.</p>}
            </div>
          </section>

          <section className="card">
            <div className="card-head"><h3>Reviews</h3><span className="muted small">{u.ratingCount ? `${u.ratingCount} total` : ''}</span></div>
            {u.reviews.length === 0 ? <p className="muted small">No reviews yet. Reviews appear after a completed swap.</p> : u.reviews.map((r) => (
              <div className="review" key={r._id}>
                <div className="row" style={{ flexWrap: 'nowrap' }}>
                  <Avatar user={r.reviewer} size={36} />
                  <div className="grow"><b style={{ fontSize: 14.5 }}>{r.reviewer?.name || 'Former member'}</b><small className="muted" style={{ display: 'block' }}>{timeAgo(r.createdAt)}</small></div>
                  <Stars value={r.rating} count={1} size={14} />
                </div>
                {r.comment && <p>{r.comment}</p>}
              </div>
            ))}
          </section>
        </div>

        <div className="stack" style={{ gap: 20 }}>
          {hasMatch && (
            <section className="card" style={{ borderColor: 'var(--amber)' }}>
              <div className="card-head"><h3><Sparkles size={17} style={{ display: 'inline', verticalAlign: '-3px', color: 'var(--accent-text)' }} /> {match.mutual ? 'Mutual match' : 'Why you match'}</h3></div>
              {match.theyTeachMe.length > 0 && <><div className="card-section-title">They can teach you</div><div className="chips" style={{ marginBottom: 14 }}>{match.theyTeachMe.map((s) => <span className="chip" key={s}>{s}</span>)}</div></>}
              {match.iTeachThem.length > 0 && <><div className="card-section-title">You can teach them</div><div className="chips">{match.iTeachThem.map((s) => <span className="chip" key={s}>{s}</span>)}</div></>}
            </section>
          )}
          <section className="card">
            <div className="card-head"><h3>Wants to learn</h3></div>
            <div className="chips">{u.learnSkills?.length ? u.learnSkills.map((s) => <LearnChip key={s} skill={s} />) : <p className="muted small">Open to anything.</p>}</div>
          </section>
          <section className="card">
            <div className="card-head"><h3>Availability</h3></div>
            <div className="chips">{u.availability?.length ? u.availability.map((a) => <span className="chip" key={a}>{a}</span>) : <p className="muted small">Not specified.</p>}</div>
          </section>
        </div>
      </div>

      {requesting && <RequestModal target={u} onClose={() => setRequesting(false)} />}
    </div>
  );
}
