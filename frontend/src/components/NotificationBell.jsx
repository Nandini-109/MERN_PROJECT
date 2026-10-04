import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../api';
import NotificationItem from './NotificationItem';
import { Spinner } from './ui';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState(null);
  const ref = useRef(null);
  const nav = useNavigate();

  const refreshCount = useCallback(() => {
    if (document.hidden) return;
    api.get('/notifications/unread-count').then((r) => setUnread(r.data.unread)).catch(() => {});
  }, []);

  useEffect(() => {
    refreshCount();
    const t = setInterval(refreshCount, 30000);
    return () => clearInterval(t);
  }, [refreshCount]);

  useEffect(() => {
    if (!open) return undefined;
    api.get('/notifications').then((r) => { setItems(r.data.items.slice(0, 6)); setUnread(r.data.unread); }).catch(() => setItems([]));
    const away = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  async function openItem(item) {
    setOpen(false);
    if (!item.read) { api.patch(`/notifications/${item._id}/read`).catch(() => {}); setUnread((n) => Math.max(0, n - 1)); }
    if (item.link) nav(item.link);
  }

  async function markAll() {
    await api.patch('/notifications/read-all').catch(() => {});
    setUnread(0);
    setItems((list) => list?.map((n) => ({ ...n, read: true })));
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="icon-btn" onClick={() => setOpen((o) => !o)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}>
        <Bell size={20} />
        {unread > 0 && <span className="count-dot">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="dropdown" style={{ width: 'min(360px, calc(100vw - 32px))', right: -8 }}>
          <div className="row between" style={{ padding: '6px 10px 10px' }}>
            <strong style={{ fontFamily: 'var(--font-display)' }}>Notifications</strong>
            {unread > 0 && <button className="link-more" onClick={markAll}>Mark all read</button>}
          </div>
          {items === null ? <div style={{ padding: 24, textAlign: 'center' }}><Spinner /></div>
            : items.length === 0 ? <p className="muted small center" style={{ padding: '20px 12px' }}>You’re all caught up. New swap activity will show here.</p>
            : items.map((n) => <NotificationItem key={n._id} item={n} onClick={openItem} />)}
          <hr />
          <Link to="/notifications" className="dropdown-item" onClick={() => setOpen(false)} style={{ justifyContent: 'center' }}>View all notifications</Link>
        </div>
      )}
    </div>
  );
}
