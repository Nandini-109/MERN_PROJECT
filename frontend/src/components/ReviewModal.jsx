import { useId, useState } from 'react';
import api, { errMsg } from '../api';
import { useToast } from '../context/FeedbackContext';
import Modal from './Modal';
import Field from './Field';
import Avatar from './Avatar';
import { ErrorBanner, Spinner, StarInput } from './ui';

export default function ReviewModal({ exchange, person, onClose, onDone }) {
  const toast = useToast();
  const id = useId();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!rating) return setError('Please choose a star rating');
    setBusy(true); setError('');
    try {
      await api.post('/reviews', { exchange: exchange._id, rating, comment });
      toast.success('Thanks! Your review has been posted');
      onDone?.();
      onClose();
    } catch (err) { setError(errMsg(err, 'Could not post your review.')); setBusy(false); }
  }

  return (
    <Modal small onClose={onClose} labelledBy={`${id}-t`}>
      <div className="modal-head">
        <div className="row" style={{ flexWrap: 'nowrap', paddingRight: 36 }}>
          <Avatar user={person} size={46} />
          <div><h2 id={`${id}-t`} style={{ fontSize: '1.3rem' }}>Rate {(person?.name || 'this member').split(' ')[0]}</h2><p>{exchange.skillOffered} ⇄ {exchange.skillWanted}</p></div>
        </div>
      </div>
      <form className="stack" onSubmit={submit}>
        <ErrorBanner>{error}</ErrorBanner>
        <StarInput value={rating} onChange={(v) => { setRating(v); setError(''); }} />
        <Field textarea rows={4} label="Your review (optional)" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={400}
          placeholder="What went well? Was the session clear and helpful?" counter={`${comment.length}/400`} />
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Not now</button>
          <button className="btn btn-primary" disabled={busy}>{busy && <Spinner />}Post review</button>
        </div>
      </form>
    </Modal>
  );
}
