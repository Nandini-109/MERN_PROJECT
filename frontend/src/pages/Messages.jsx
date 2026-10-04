import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import api, { errMsg } from '../api';
import { useToast } from '../context/FeedbackContext';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Avatar from '../components/Avatar';
import { EmptyState, ErrorState, Skeleton, Spinner, StatusBadge } from '../components/ui';
import { dayLabel, displayName, timeAgo, timeOnly } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export default function Messages() {
  useDocumentTitle('Messages');
  const { exchangeId } = useParams();
  const nav = useNavigate();
  const convos = useAsync(() => api.get('/messages/conversations').then((r) => r.data), []);

  // Keep the list (unread counts, last message) fresh.
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) convos.reload({ silent: true }); }, 15000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container page">
      <div className="page-head" style={{ marginBottom: 20 }}>
        <div><span className="eyebrow">Messages</span><h1>Chat with your swap partners</h1></div>
      </div>

      {convos.error ? <ErrorState message={convos.error} onRetry={convos.reload} />
        : convos.loading ? <Skeleton h={480} r={28} />
        : convos.data.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No conversations yet" action={<Link to="/requests" className="btn btn-primary">View my swaps</Link>}>
            Chat opens automatically once a swap request is accepted. Plan your sessions here.
          </EmptyState>
        ) : (
          <div className={`chat ${exchangeId ? 'show-thread' : ''}`}>
            <div className="chat-list" role="list" aria-label="Conversations">
              {convos.data.map((c) => (
                <button key={c._id} role="listitem" className={`convo ${c._id === exchangeId ? 'active' : ''}`} onClick={() => nav(`/messages/${c._id}`)}>
                  <Avatar user={c.other} size={44} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="row between" style={{ flexWrap: 'nowrap', gap: 6 }}>
                      <b className="truncate">{displayName(c.other)}</b>
                      {c.lastMessage && <small className="muted" style={{ flex: 'none' }}>{timeAgo(c.lastMessage.createdAt)}</small>}
                    </div>
                    <p className="truncate">{c.lastMessage ? `${c.lastMessage.mine ? 'You: ' : ''}${c.lastMessage.text}` : `${c.skillOffered} ⇄ ${c.skillWanted}`}</p>
                  </div>
                  {c.unread > 0 && <span className="count-dot">{c.unread}</span>}
                </button>
              ))}
            </div>

            {exchangeId
              ? <Thread key={exchangeId} id={exchangeId} onRead={() => convos.reload({ silent: true })} />
              : <div className="chat-thread chat-empty"><p className="muted">Select a conversation to start chatting</p></div>}
          </div>
        )}
    </div>
  );
}

function Thread({ id, onRead }) {
  const { user } = useAuth();
  const toast = useToast();
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bodyRef = useRef(null);
  const lastCount = useRef(0);

  const load = useCallback(async (silent) => {
    try {
      const { data } = await api.get(`/messages/${id}`);
      setState({ loading: false, error: '', data });
      if (!silent) onRead();
    } catch (e) {
      if (!silent) setState({ loading: false, error: errMsg(e, 'Could not open this conversation.'), data: null });
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load(false);
    const t = setInterval(() => { if (!document.hidden) load(true); }, 5000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const n = state.data?.messages.length || 0;
    if (n !== lastCount.current && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    lastCount.current = n;
  }, [state.data]);

  async function send(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      const { data } = await api.post(`/messages/${id}`, { text: value });
      setText('');
      setState((s) => ({ ...s, data: { ...s.data, messages: [...s.data.messages, data] } }));
    } catch (err) { toast.error(errMsg(err, 'Message could not be sent.')); }
    finally { setSending(false); }
  }

  if (state.loading) return <div className="chat-thread" style={{ padding: 24 }}><Skeleton h={40} /><Skeleton h={300} style={{ marginTop: 16 }} r={16} /></div>;
  if (state.error) return <div className="chat-thread" style={{ padding: 24 }}><ErrorState message={state.error} onRetry={() => load(false)} /></div>;

  const { exchange, messages } = state.data;
  let lastDay = '';
  return (
    <div className="chat-thread">
      <div className="chat-head">
        <Link to="/messages" className="icon-btn chat-back" aria-label="Back to conversations"><ArrowLeft size={20} /></Link>
        <Avatar user={exchange.other} size={40} />
        <div className="grow" style={{ minWidth: 0 }}>
          <Link to={`/u/${exchange.other?._id}`}><b className="truncate" style={{ display: 'block' }}>{displayName(exchange.other)}</b></Link>
          <small className="muted truncate" style={{ display: 'block' }}>{exchange.skillOffered} ⇄ {exchange.skillWanted}</small>
        </div>
        <StatusBadge status={exchange.status} />
      </div>

      <div className="chat-body" ref={bodyRef} aria-live="polite">
        {messages.length === 0 && <p className="muted center small" style={{ margin: 'auto' }}>Say hello 👋 and suggest a time for your first session.</p>}
        {messages.map((m) => {
          const day = dayLabel(m.createdAt);
          const sep = day !== lastDay;
          lastDay = day;
          const mine = String(m.sender) === String(user.id);
          return (
            <div key={m._id} style={{ display: 'contents' }}>
              {sep && <span className="day-sep">{day}</span>}
              <div className={`bubble ${mine ? 'mine' : ''}`}>{m.text}<time>{timeOnly(m.createdAt)}</time></div>
            </div>
          );
        })}
      </div>

      <form className="chat-form" onSubmit={send}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" maxLength={1000} aria-label="Message" />
        <button className="btn btn-primary" disabled={!text.trim() || sending} aria-label="Send message">{sending ? <Spinner /> : <Send size={17} />}</button>
      </form>
    </div>
  );
}
