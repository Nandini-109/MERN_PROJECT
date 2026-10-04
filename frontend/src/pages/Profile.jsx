import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Eye, Lock, MapPin, Save, Trash2, User as UserIcon } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useConfirm, useToast } from '../context/FeedbackContext';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Avatar from '../components/Avatar';
import Field from '../components/Field';
import SkillAdder from '../components/SkillAdder';
import { ErrorBanner, ErrorState, LearnChip, LevelDot, ProgressRing, Skeleton, Spinner } from '../components/ui';
import { AVAILABILITY, LEVELS, fileToAvatar, levelOf } from '../lib/utils';

const toForm = (u) => ({
  name: u.name || '', headline: u.headline || '', location: u.location || '', bio: u.bio || '', avatar: u.avatar || '',
  availability: u.availability || [], learn: u.learnSkills || [],
  teach: (u.teachSkills || []).map((skill) => ({ skill, level: levelOf(u, skill) }))
});

export default function Profile() {
  useDocumentTitle('My profile');
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const me = useAsync(() => api.get('/users/me').then((r) => r.data), []);

  if (me.loading) return <div className="container page narrow"><Skeleton h={120} r={20} /><Skeleton h={360} r={20} style={{ marginTop: 20 }} /></div>;
  if (me.error) return <div className="container page narrow"><ErrorState message={me.error} onRetry={me.reload} /></div>;

  return (
    <div className="container page narrow">
      <ProfileForm key={me.data._id} initial={me.data} completion={me.data.completion} user={user} toast={toast}
        onSaved={(saved) => { me.setData(saved); refreshProfile(); }} />
      <PasswordCard toast={toast} />
    </div>
  );
}

function ProfileForm({ initial, completion, user, toast, onSaved }) {
  const confirm = useConfirm();
  const [form, setForm] = useState(() => toForm(initial));
  const [baseline, setBaseline] = useState(() => JSON.stringify(toForm(initial)));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef(null);
  const dirty = JSON.stringify(form) !== baseline;
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: '' })); };

  async function pickPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    try { setForm((f) => ({ ...f, avatar: '' })); const avatar = await fileToAvatar(file); setForm((f) => ({ ...f, avatar })); }
    catch (err) { toast.error(err.message); }
    finally { setPhotoBusy(false); }
  }

  async function save(e) {
    e.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Your name must be at least 2 characters';
    if (form.bio.length > 500) next.bio = 'Bio must be under 500 characters';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true); setError('');
    try {
      const { data } = await api.put('/users/me', {
        name: form.name, headline: form.headline, location: form.location, bio: form.bio, avatar: form.avatar,
        availability: form.availability, learnSkills: form.learn,
        teachSkills: form.teach.map((t) => t.skill), teachLevels: form.teach
      });
      localStorage.setItem('skillswap_user', JSON.stringify({ ...user, name: data.name }));
      const fresh = toForm(data);
      setForm(fresh); setBaseline(JSON.stringify(fresh));
      onSaved(data);
      toast.success('Profile updated successfully');
    } catch (err) { setError(errMsg(err, 'Could not save your profile.')); }
    finally { setBusy(false); }
  }

  async function removePhoto() {
    if (await confirm({ title: 'Remove profile photo?', message: 'Your initials will be shown instead. You can upload a new photo any time.', confirmText: 'Remove', danger: true })) {
      setForm((f) => ({ ...f, avatar: '' }));
    }
  }

  const toggleAvail = (a) => setForm((f) => ({ ...f, availability: f.availability.includes(a) ? f.availability.filter((x) => x !== a) : [...f.availability, a] }));

  return (
    <form onSubmit={save} noValidate>
      <div className="page-head">
        <div><span className="eyebrow">My profile</span><h1>Build your learning profile</h1><p>A complete profile gets noticed – people can see what you teach, what you want to learn and when you’re free.</p></div>
        <Link to={`/u/${initial._id}`} className="btn btn-secondary"><Eye size={17} />View public profile</Link>
      </div>

      <div className="stack" style={{ gap: 20 }}>
        <section className="card completion">
          <ProgressRing percent={completion.percent} size={84} stroke={8} />
          <div className="grow">
            <h3>{completion.percent === 100 ? 'Your profile is complete 🎉' : 'Profile completion'}</h3>
            {completion.missing.length > 0 && <ul className="todo-list" style={{ marginTop: 8 }}>{completion.missing.slice(0, 3).map((m) => <li key={m}>• {m}</li>)}</ul>}
          </div>
        </section>

        <section className="card card-pad-lg stack" style={{ gap: 20 }}>
          <div className="card-head" style={{ marginBottom: 0 }}><h3>Basic information</h3></div>
          <ErrorBanner>{error}</ErrorBanner>
          <div className="uploader">
            <Avatar user={{ name: form.name, avatar: form.avatar }} size={84} />
            <div>
              <div className="row">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={photoBusy}>{photoBusy ? <Spinner /> : <Camera size={16} />}Upload photo</button>
                {form.avatar && <button type="button" className="btn btn-ghost btn-sm" onClick={removePhoto}><Trash2 size={15} />Remove</button>}
              </div>
              <p className="hint small muted" style={{ marginTop: 6 }}>JPG, PNG or WebP. It’s resized automatically.</p>
              <input ref={fileRef} aria-label="Upload profile photo" type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pickPhoto} />
            </div>
          </div>
          <div className="grid grid-2" style={{ gap: 16 }}>
            <Field label="Full name" icon={UserIcon} value={form.name} onChange={set('name')} error={errors.name} maxLength={60} />
            <Field label="Location" icon={MapPin} value={form.location} onChange={set('location')} placeholder="Mumbai" maxLength={80} />
          </div>
          <Field label="Headline" value={form.headline} onChange={set('headline')} placeholder="e.g. BScIT student · Python tutor" maxLength={100} hint="One line that tells people who you are." />
          <Field textarea rows={4} label="About you" value={form.bio} onChange={set('bio')} error={errors.bio} placeholder="Share your background, how you like to learn, and what you’re excited about…" maxLength={500} counter={`${form.bio.length}/500`} />
        </section>

        <section className="card card-pad-lg stack" style={{ gap: 16 }}>
          <div><h3>Skills I can teach</h3><p className="text-2 small" style={{ marginTop: 4 }}>Add a level so learners know what to expect.</p></div>
          <SkillAdder withLevel existing={form.teach.map((t) => t.skill)} onAdd={(skill, level) => setForm((f) => ({ ...f, teach: [...f.teach, { skill, level }] }))} placeholder="Skill you can teach…" />
          <div className="stack" style={{ gap: 8 }}>
            {form.teach.length === 0 && <p className="muted small">You haven’t added any skills yet.</p>}
            {form.teach.map((t) => (
              <div className="skill-row" key={t.skill}>
                <LevelDot level={t.level} /><b>{t.skill}</b>
                <select className="select sm" style={{ width: 'auto', marginLeft: 'auto' }} value={t.level} aria-label={`Level for ${t.skill}`}
                  onChange={(e) => setForm((f) => ({ ...f, teach: f.teach.map((x) => (x.skill === t.skill ? { ...x, level: e.target.value } : x)) }))}>
                  {LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
                <button type="button" className="icon-btn" aria-label={`Remove ${t.skill}`} onClick={() => setForm((f) => ({ ...f, teach: f.teach.filter((x) => x.skill !== t.skill) }))}><Trash2 size={17} /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="card card-pad-lg stack" style={{ gap: 16 }}>
          <div><h3>Skills I want to learn</h3><p className="text-2 small" style={{ marginTop: 4 }}>We use these to recommend the right people.</p></div>
          <SkillAdder existing={form.learn} onAdd={(skill) => setForm((f) => ({ ...f, learn: [...f.learn, skill] }))} placeholder="Skill you want to learn…" />
          <div className="chips">
            {form.learn.length === 0 && <p className="muted small">Nothing here yet.</p>}
            {form.learn.map((s) => <LearnChip key={s} skill={s} onRemove={(x) => setForm((f) => ({ ...f, learn: f.learn.filter((y) => y !== x) }))} />)}
          </div>
        </section>

        <section className="card card-pad-lg stack" style={{ gap: 16 }}>
          <div><h3>Availability</h3><p className="text-2 small" style={{ marginTop: 4 }}>When are you usually free for a session?</p></div>
          <div className="avail-grid">
            {AVAILABILITY.map((a) => <button type="button" key={a} className="avail" aria-pressed={form.availability.includes(a)} onClick={() => toggleAvail(a)}>{a}</button>)}
          </div>
        </section>
      </div>

      {dirty && (
        <div className="save-bar" role="region" aria-label="Unsaved changes">
          <span className="small">You have unsaved changes</span>
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn btn-light btn-sm" onClick={() => { setForm(JSON.parse(baseline)); setErrors({}); }} disabled={busy}>Discard</button>
            <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? <Spinner /> : <Save size={15} />}{busy ? 'Saving…' : 'Save changes'}</button>
          </div>
        </div>
      )}
    </form>
  );
}

function PasswordCard({ toast }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (form.newPassword.length < 6) return setError('New password must be at least 6 characters');
    setBusy(true); setError('');
    try {
      await api.put('/auth/password', form);
      setForm({ currentPassword: '', newPassword: '' });
      toast.success('Password updated');
    } catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  }

  return (
    <form className="card card-pad-lg stack" style={{ gap: 16, marginTop: 20 }} onSubmit={submit} noValidate>
      <div><h3>Security</h3><p className="text-2 small" style={{ marginTop: 4 }}>Change your password. You’ll stay signed in on this device.</p></div>
      <ErrorBanner>{error}</ErrorBanner>
      <div className="grid grid-2" style={{ gap: 16 }}>
        <Field label="Current password" icon={Lock} type="password" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        <Field label="New password" icon={Lock} type="password" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
      </div>
      <div><button className="btn btn-dark" disabled={busy || !form.currentPassword || !form.newPassword}>{busy && <Spinner />}Update password</button></div>
    </form>
  );
}
