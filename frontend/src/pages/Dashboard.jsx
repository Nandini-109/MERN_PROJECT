import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, Circle, Compass, Eye, GraduationCap, Heart, MessageSquare, Repeat, Star, Users } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Avatar from '../components/Avatar';
import SkillModal from '../components/SkillModal';
import { BarChart, EmptyState, ErrorState, LearnChip, ProgressRing, Skeleton, StatCard, StatusBadge, TeachChip } from '../components/ui';
import { displayName, getRecent, greeting, isGone, timeAgo } from '../lib/utils';

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user, profile, refreshProfile } = useAuth();
  const [modal, setModal] = useState(null); // 'teach' | 'learn'
  const stats = useAsync(() => api.get('/stats/dashboard').then((r) => r.data), []);
  const recs = useAsync(() => api.get('/users/recommended').then((r) => r.data), []);
  const recent = getRecent();
  const first = (user?.name || 'there').split(' ')[0];

  // Defaults keep the page rendering if the API returns partial data (older records, schema drift).
  const s = stats.data;
  const counts = { teach: 0, learn: 0, completed: 0, receivedPending: 0, unreadMessages: 0, active: 0, favorites: 0, ...(s?.counts || {}) };
  const rating = { avg: 0, count: 0, ...(s?.rating || {}) };
  const completion = { percent: 0, missing: [], ...(s?.completion || {}) };
  const activity = Array.isArray(s?.activity) ? s.activity : [];
  const recentSwaps = Array.isArray(s?.recent) ? s.recent.filter(Boolean) : [];
  const recommended = Array.isArray(recs.data) ? recs.data.filter((u) => u && u._id) : [];

  const afterSkillChange = () => { stats.reload({ silent: true }); recs.reload({ silent: true }); refreshProfile(); };

  return (
    <div className="container page">
      {/* ---------- Welcome ---------- */}
      <section className="dark-card welcome">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>{greeting()}, <span className="serif">{first}.</span></h1>
          <p>
            {counts.receivedPending
              ? `You have ${counts.receivedPending} swap request${counts.receivedPending > 1 ? 's' : ''} waiting for your reply.`
              : 'Here’s what’s happening with your skill exchanges today.'}
          </p>
          <div className="quick-actions">
            <button className="btn btn-primary" onClick={() => setModal('teach')}><GraduationCap size={17} />Offer a skill</button>
            <button className="btn btn-light" onClick={() => setModal('learn')}><BookOpen size={17} />Request a skill</button>
            <Link to="/discover" className="btn btn-light"><Compass size={17} />Find people</Link>
          </div>
        </div>
        <div className="welcome-side">
          <Link to="/requests" className="alert-line"><Repeat size={18} color="var(--amber-soft)" />Requests to answer<b>{s ? counts.receivedPending : '–'}</b></Link>
          <Link to="/messages" className="alert-line"><MessageSquare size={18} color="var(--amber-soft)" />Unread messages<b>{s ? counts.unreadMessages : '–'}</b></Link>
          <Link to="/requests" className="alert-line"><Users size={18} color="var(--amber-soft)" />Active swaps<b>{s ? counts.active : '–'}</b></Link>
        </div>
      </section>

      {stats.error && <ErrorState message={stats.error} onRetry={stats.reload} />}

      {/* ---------- Stats ---------- */}
      {!stats.error && (
        <section className="grid grid-4" style={{ marginBottom: 20 }} aria-label="Your statistics">
          {stats.loading ? [0, 1, 2, 3].map((i) => <div className="card" key={i}><Skeleton w={40} h={40} r={12} /><Skeleton w="50%" h={32} style={{ marginTop: 14 }} /><Skeleton w="70%" h={12} style={{ marginTop: 10 }} /></div>)
            : <>
              <StatCard icon={GraduationCap} tone="amber" value={counts.teach} label="Skills you offer" />
              <StatCard icon={BookOpen} tone="indigo" value={counts.learn} label="Skills you want" />
              <StatCard icon={CheckCircle2} tone="teal" value={counts.completed} label="Completed swaps" />
              <StatCard icon={Star} tone="rose" value={rating.count ? Number(rating.avg || 0).toFixed(1) : '–'} label={rating.count ? `Average from ${rating.count} review${rating.count > 1 ? 's' : ''}` : 'No reviews yet'} />
            </>}
        </section>
      )}

      <div className="split">
        <div className="stack" style={{ gap: 20 }}>
          {/* ---------- Recommended ---------- */}
          <section className="card">
            <div className="card-head"><h3>Recommended for you</h3><Link to="/discover" className="link-more">See all <ArrowRight size={14} /></Link></div>
            {recs.loading ? <div className="stack">{[0, 1, 2].map((i) => <Skeleton key={i} h={56} r={14} />)}</div>
              : recs.error ? <ErrorState message={recs.error} onRetry={recs.reload} />
              : recommended.length === 0 ? (
                <EmptyState icon={Users} title="No matches yet" action={<button className="btn btn-primary btn-sm" onClick={() => setModal('learn')}>Add a skill you want</button>}>
                  Add skills you want to learn and skills you can teach – we’ll suggest people who fit.
                </EmptyState>
              ) : recommended.slice(0, 4).map((u) => (
                <Link key={u._id} to={`/u/${u._id}`} className="mini-person">
                  <Avatar user={u} size={44} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <b className="truncate">{u.name}</b>
                    <small className="truncate" style={{ display: 'block' }}>
                      {u.match?.theyTeachMe?.length ? `Teaches ${u.match.theyTeachMe.slice(0, 2).join(', ')}` : (u.headline || 'Member')}
                    </small>
                  </div>
                  {u.match?.mutual ? <span className="match-pill">Mutual match</span> : <span className="badge">{u.match?.theyTeachMe?.length ? 'Teaches your goal' : 'Wants your skill'}</span>}
                </Link>
              ))}
          </section>

          {/* ---------- Activity ---------- */}
          <section className="card">
            <div className="card-head"><h3>Activity this week</h3><span className="muted small">Requests & messages</span></div>
            {stats.loading ? <Skeleton h={160} r={14} /> : s && <BarChart data={activity} />}
          </section>

          {/* ---------- Recent ---------- */}
          <section className="card">
            <div className="card-head"><h3>Recent activity</h3><Link to="/requests" className="link-more">All swaps <ArrowRight size={14} /></Link></div>
            {stats.loading ? <div className="stack">{[0, 1, 2].map((i) => <Skeleton key={i} h={44} r={12} />)}</div>
              : recentSwaps.length === 0 ? <EmptyState icon={Repeat} title="No swaps yet" action={<Link to="/discover" className="btn btn-primary btn-sm">Send your first request</Link>}>Your swap requests and exchange history will appear here.</EmptyState>
              : recentSwaps.map((r) => (
                <div className="list-row" key={r._id}>
                  <Avatar user={r.other} size={40} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <b className="truncate" style={{ display: 'block', fontSize: 14.5 }}>{r.direction === 'sent' ? `You → ${displayName(r.other)}` : `${displayName(r.other)} → you`}{isGone(r.other) && <span className="badge" style={{ marginLeft: 8 }}>No longer a member</span>}</b>
                    <small className="truncate">{r.skillOffered} ⇄ {r.skillWanted} · {timeAgo(r.updatedAt)}</small>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
          </section>
        </div>

        <div className="stack" style={{ gap: 20 }}>
          {/* ---------- Completion ---------- */}
          <section className="card">
            <div className="card-head"><h3>Profile strength</h3></div>
            {stats.loading ? <Skeleton h={96} r={14} /> : s && (
              <div className="completion">
                <ProgressRing percent={completion.percent} />
                <div className="grow">
                  {completion.missing.length === 0
                    ? <p className="text-2 small">Your profile is complete – you’ll get the best matches!</p>
                    : <ul className="todo-list">{completion.missing.slice(0, 3).map((m) => <li key={m}><Circle size={14} />{m}</li>)}</ul>}
                </div>
              </div>
            )}
            {s && completion.percent < 100 && <Link to="/profile" className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 16 }}>Complete profile</Link>}
          </section>

          {/* ---------- Skills ---------- */}
          <section className="card">
            <div className="card-head"><h3>Your skills</h3><Link to="/profile" className="link-more">Edit</Link></div>
            <div className="card-section-title">Offering</div>
            <div className="chips" style={{ marginBottom: 16 }}>
              {profile?.teachSkills?.length ? profile.teachSkills.map((sk) => <TeachChip key={sk} user={profile} skill={sk} />) : <span className="muted small">Nothing yet – <button className="link-more" onClick={() => setModal('teach')}>offer a skill</button></span>}
            </div>
            <div className="card-section-title">Learning</div>
            <div className="chips">
              {profile?.learnSkills?.length ? profile.learnSkills.map((sk) => <LearnChip key={sk} skill={sk} />) : <span className="muted small">Nothing yet – <button className="link-more" onClick={() => setModal('learn')}>request a skill</button></span>}
            </div>
          </section>

          {/* ---------- Recently viewed ---------- */}
          <section className="card">
            <div className="card-head"><h3>Recently viewed</h3>{s && <Link to="/favorites" className="link-more"><Heart size={14} />{counts.favorites} saved</Link>}</div>
            {recent.length === 0 ? <p className="muted small"><Eye size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Profiles you visit will show up here for quick access.</p>
              : recent.map((r) => (
                <Link key={r._id} to={`/u/${r._id}`} className="mini-person"><Avatar user={r} size={38} /><div><b>{r.name}</b><small>{r.headline || 'Member'}</small></div></Link>
              ))}
          </section>
        </div>
      </div>

      {modal && <SkillModal type={modal} onClose={() => setModal(null)} onSaved={afterSkillChange} />}
    </div>
  );
}
