import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Check, CheckCheck, Inbox, MessageSquare, Repeat, Send, Star, X } from 'lucide-react';
import api, { errMsg } from '../api';
import { useConfirm, useToast } from '../context/FeedbackContext';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Avatar from '../components/Avatar';
import ReviewModal from '../components/ReviewModal';
import { EmptyState, ErrorState, Skeleton, Spinner, StatusBadge, Tabs } from '../components/ui';
import { displayName, isGone, timeAgo } from '../lib/utils';

export default function Requests() {
  useDocumentTitle('My swaps');
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, error, reload } = useAsync(() => api.get('/requests/mine').then((r) => r.data), []);
  const [tab, setTab] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [reviewing, setReviewing] = useState(null);

  const groups = useMemo(() => {
    const all = [
      ...(data?.received || []).map((r) => ({ r, person: r.sender, dir: 'in' })),
      ...(data?.sent || []).map((r) => ({ r, person: r.receiver, dir: 'out' }))
    ].map((x) => ({ ...x, person: x.person || { name: 'Deleted member', deleted: true } }));
    const byDate = (a, b) => new Date(b.r.updatedAt) - new Date(a.r.updatedAt);
    return {
      incoming: all.filter((x) => x.dir === 'in' && x.r.status === 'pending').sort(byDate),
      outgoing: all.filter((x) => x.dir === 'out' && x.r.status === 'pending').sort(byDate),
      active: all.filter((x) => x.r.status === 'accepted').sort(byDate),
      history: all.filter((x) => ['completed', 'rejected', 'cancelled'].includes(x.r.status)).sort(byDate)
    };
  }, [data]);

  const current = tab || (['incoming', 'active', 'outgoing', 'history'].find((k) => groups[k].length) || 'incoming');
  const list = groups[current];

  async function update(id, status, success) {
    setBusyId(id);
    try { await api.patch(`/requests/${id}`, { status }); toast.success(success); await reload({ silent: true }); }
    catch (e) { toast.error(errMsg(e, 'Could not update the request.')); }
    finally { setBusyId(''); }
  }

  const decline = async ({ r, person }) => {
    if (await confirm({ title: 'Decline this request?', message: `${displayName(person)} will be notified that you can’t swap right now.`, confirmText: 'Decline', danger: true })) update(r._id, 'rejected', 'Request declined');
  };
  const cancel = async ({ r, person }) => {
    if (await confirm({ title: 'Cancel your request?', message: `Your pending request to ${displayName(person)} will be withdrawn.`, confirmText: 'Cancel request', danger: true })) update(r._id, 'cancelled', 'Request cancelled');
  };
  const complete = async ({ r, person }) => {
    if (await confirm({ title: 'Mark swap as completed?', message: `This closes the exchange with ${displayName(person)} and lets you both leave a review.`, confirmText: 'Mark completed' })) update(r._id, 'completed', 'Swap completed – don’t forget to leave a review!');
  };

  const EMPTY = {
    incoming: ['No incoming requests', Inbox, 'When someone asks to swap skills with you, you’ll see the request here.'],
    outgoing: ['No pending requests', Send, 'Requests you send are shown here until the other person replies.'],
    active: ['No active swaps', Repeat, 'Accepted swaps appear here. You can chat and mark them complete.'],
    history: ['Your swap history is empty', CheckCheck, 'Completed, declined and cancelled swaps are kept here.']
  };
  const [emptyTitle, EmptyIcon, emptyText] = EMPTY[current];

  return (
    <div className="container page">
      <div className="page-head">
        <div><span className="eyebrow">Skill exchanges</span><h1>Your swaps</h1><p>Respond to requests, keep track of active exchanges and look back at your history.</p></div>
        <Link to="/discover" className="btn btn-primary"><ArrowLeftRight size={17} />Find a new swap</Link>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Tabs label="Swap categories" value={current} onChange={setTab} tabs={[
          { id: 'incoming', label: 'Incoming', count: groups.incoming.length },
          { id: 'active', label: 'Active', count: groups.active.length },
          { id: 'outgoing', label: 'Sent', count: groups.outgoing.length },
          { id: 'history', label: 'History' }
        ]} />
      </div>

      {error ? <ErrorState message={error} onRetry={reload} />
        : loading ? <div className="grid grid-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={190} r={20} />)}</div>
        : list.length === 0 ? <EmptyState icon={EmptyIcon} title={emptyTitle} action={current !== 'history' && <Link to="/discover" className="btn btn-primary">Discover people</Link>}>{emptyText}</EmptyState>
        : (
          <div className="grid grid-2">
            {list.map((item) => {
              const { r, person, dir } = item;
              const busy = busyId === r._id;
              const gone = isGone(person); // other member's account no longer exists
              return (
                <article className="card req-card" key={r._id}>
                  <div className="req-top">
                    <Avatar user={person} size={48} />
                    <div className="grow" style={{ minWidth: 0 }}>
                      {isGone(person)
                        ? <span style={{ fontWeight: 600, fontFamily: 'var(--font-display)' }} className="muted">Deleted member</span>
                        : <Link to={`/u/${person._id}`} style={{ fontWeight: 600, fontFamily: 'var(--font-display)' }} className="truncate">{person.name}</Link>}
                      <small className="muted" style={{ display: 'block' }}>{dir === 'in' ? 'Sent you a request' : 'You sent a request'} · {timeAgo(r.createdAt)}</small>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  <div className="swap-line">
                    <span><small className="muted">{dir === 'in' ? 'They teach' : 'You teach'}</small><br /><b>{r.skillOffered}</b></span>
                    <ArrowLeftRight size={16} />
                    <span><small className="muted">{dir === 'in' ? 'You teach' : 'They teach'}</small><br /><b>{r.skillWanted}</b></span>
                  </div>

                  {r.message && <p className="req-msg">“{r.message}”</p>}

                  <div className="req-actions">
                    {dir === 'in' && r.status === 'pending' && <>
                      <button className="btn btn-primary btn-sm" disabled={busy || gone} title={gone ? 'This member has left SkillSwap' : undefined} onClick={() => update(r._id, 'accepted', `You accepted ${displayName(person)}’s request`)}>{busy ? <Spinner /> : <Check size={16} />}Accept</button>
                      <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => decline(item)}><X size={16} />Decline</button>
                    </>}
                    {dir === 'out' && r.status === 'pending' && <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => cancel(item)}>{busy && <Spinner />}Cancel request</button>}
                    {r.status === 'accepted' && !gone && <>
                      <Link to={`/messages/${r._id}`} className="btn btn-primary btn-sm"><MessageSquare size={16} />Message</Link>
                      <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => complete(item)}>{busy ? <Spinner /> : <CheckCheck size={16} />}Mark completed</button>
                    </>}
                    {gone && r.status !== 'pending' && <span className="badge">This member has left SkillSwap</span>}
                    {r.status === 'completed' && !gone && (r.reviewed
                      ? <span className="badge success"><Check size={13} />Reviewed</span>
                      : <button className="btn btn-primary btn-sm" onClick={() => setReviewing(item)}><Star size={16} />Leave a review</button>)}
                    {r.status === 'completed' && !gone && <Link to={`/messages/${r._id}`} className="btn btn-ghost btn-sm"><MessageSquare size={16} />Chat</Link>}
                  </div>
                </article>
              );
            })}
          </div>
        )}

      {reviewing && <ReviewModal exchange={reviewing.r} person={reviewing.person} onClose={() => setReviewing(null)} onDone={() => reload({ silent: true })} />}
    </div>
  );
}
