import { useId, useState } from 'react';
import { BookOpen, GraduationCap } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/FeedbackContext';
import Modal from './Modal';
import SkillAdder from './SkillAdder';
import { ErrorBanner, LearnChip, TeachChip } from './ui';

/** Quick "Offer a skill" / "Request a skill" dialog – saves straight to the profile. */
export default function SkillModal({ type, onClose, onSaved }) {
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();
  const id = useId();
  const teach = type === 'teach';
  const key = teach ? 'teachSkills' : 'learnSkills';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = profile?.[key] || [];

  async function add(name, level) {
    setBusy(true); setError('');
    try {
      const payload = { [key]: [...current, name] };
      if (teach) payload.teachLevels = [...(profile?.teachLevels || []), { skill: name, level }];
      await api.put('/users/me', payload);
      await refreshProfile();
      toast.success(teach ? `${name} added to the skills you offer` : `${name} added to your wish list`);
      onSaved?.();
    } catch (e) { setError(errMsg(e, 'Could not save that skill.')); }
    finally { setBusy(false); }
  }

  async function remove(name) {
    try {
      await api.put('/users/me', { [key]: current.filter((s) => s !== name) });
      await refreshProfile();
      onSaved?.();
    } catch (e) { setError(errMsg(e)); }
  }

  return (
    <Modal onClose={onClose} labelledBy={`${id}-t`}>
      <div className="modal-head">
        <div style={{ paddingRight: 36 }}>
          <div className={`stat-icon ${teach ? 'amber' : 'indigo'}`} style={{ marginBottom: 14 }}>{teach ? <GraduationCap size={20} /> : <BookOpen size={20} />}</div>
          <h2 id={`${id}-t`} style={{ fontSize: '1.4rem' }}>{teach ? 'Offer a skill' : 'Request a skill'}</h2>
          <p>{teach ? 'Share something you can teach and how confident you are.' : 'Tell the community what you’d love to learn next.'}</p>
        </div>
      </div>
      <div className="stack">
        <ErrorBanner>{error}</ErrorBanner>
        <SkillAdder withLevel={teach} existing={current} onAdd={add} busy={busy} placeholder={teach ? 'Skill you can teach…' : 'Skill you want to learn…'} />
        {current.length > 0 && (
          <div>
            <div className="card-section-title">{teach ? 'Currently offering' : 'Currently learning'}</div>
            <div className="chips">
              {current.map((s) => teach ? <TeachChip key={s} user={profile} skill={s} onRemove={remove} /> : <LearnChip key={s} skill={s} onRemove={remove} />)}
            </div>
          </div>
        )}
      </div>
      <div className="modal-actions"><button className="btn btn-dark" onClick={onClose}>Done</button></div>
    </Modal>
  );
}
