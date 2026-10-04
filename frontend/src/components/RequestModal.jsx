import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Send } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/FeedbackContext';
import Modal from './Modal';
import Field from './Field';
import Avatar from './Avatar';
import { ErrorBanner, Spinner } from './ui';

export default function RequestModal({ target, onClose, onSent }) {
  const { profile } = useAuth();
  const toast = useToast();
  const id = useId();
  const mine = profile?.teachSkills || [];
  const theirs = target.teachSkills || [];

  const [form, setForm] = useState({
    skillOffered: target.match?.iTeachThem?.[0] || mine[0] || '',
    skillWanted: target.match?.theyTeachMe?.[0] || theirs[0] || '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: '' })); };

  async function submit(e) {
    e.preventDefault();
    const next = {};
    if (!form.skillOffered.trim()) next.skillOffered = 'Tell them which skill you can teach';
    if (!form.skillWanted.trim()) next.skillWanted = 'Choose the skill you want to learn';
    if (form.message.length > 500) next.message = 'Please keep your message under 500 characters';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true); setError('');
    try {
      await api.post('/requests', { receiver: target._id, ...form });
      toast.success(`Swap request sent to ${target.name}`);
      onSent?.();
      onClose();
    } catch (err) {
      setError(errMsg(err, 'Could not send your request.'));
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} labelledBy={`${id}-t`}>
      <div className="modal-head">
        <div className="row" style={{ flexWrap: 'nowrap', paddingRight: 36 }}>
          <Avatar user={target} size={48} />
          <div>
            <h2 id={`${id}-t`} style={{ fontSize: '1.35rem' }}>Swap with {target.name.split(' ')[0]}</h2>
            <p>Propose a skill exchange – you teach, they teach.</p>
          </div>
        </div>
      </div>

      <form className="stack" onSubmit={submit} noValidate>
        <ErrorBanner>{error}</ErrorBanner>
        {mine.length === 0 && (
          <div className="form-error" style={{ background: 'var(--tint-amber)', color: 'var(--accent-text)' }}>
            <span>You haven’t listed a skill to offer yet. <Link to="/profile" style={{ textDecoration: 'underline' }} onClick={onClose}>Add one on your profile</Link> to get faster replies.</span>
          </div>
        )}
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div>
            <Field label="I will teach" list={`${id}-mine`} value={form.skillOffered} onChange={set('skillOffered')} error={errors.skillOffered} placeholder="e.g. Python" maxLength={60} />
            <datalist id={`${id}-mine`}>{mine.map((s) => <option key={s} value={s} />)}</datalist>
          </div>
          <div>
            <Field label="I want to learn" list={`${id}-theirs`} value={form.skillWanted} onChange={set('skillWanted')} error={errors.skillWanted} placeholder="e.g. UI/UX Design" maxLength={60} />
            <datalist id={`${id}-theirs`}>{theirs.map((s) => <option key={s} value={s} />)}</datalist>
          </div>
        </div>
        <div className="row small text-2" style={{ justifyContent: 'center', gap: 8 }}><ArrowLeftRight size={15} />A fair swap: one skill for another</div>
        <Field textarea rows={4} label="Message (optional)" value={form.message} onChange={set('message')} error={errors.message}
          placeholder={`Hi ${target.name.split(' ')[0]}, I'd love to swap skills! I'm free on…`} counter={`${form.message.length}/500`} />
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? <Spinner /> : <Send size={16} />}{busy ? 'Sending…' : 'Send request'}</button>
        </div>
      </form>
    </Modal>
  );
}
