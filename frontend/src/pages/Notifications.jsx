import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../api';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import NotificationItem from '../components/NotificationItem';
import { EmptyState, ErrorState, Skeleton } from '../components/ui';

export default function Notifications() {
  useDocumentTitle('Notifications');
  const nav = useNavigate();
  const { data, loading, error, reload, setData } = useAsync(() => api.get('/notifications').then((r) => r.data), []);

  async function markAll() {
    await api.patch('/notifications/read-all').catch(() => {});
    setData((d) => ({ unread: 0, items: d.items.map((n) => ({ ...n, read: true })) }));
  }
  async function open(n) {
    if (!n.read) api.patch(`/notifications/${n._id}/read`).catch(() => {});
    if (n.link) nav(n.link);
    else setData((d) => ({ ...d, items: d.items.map((x) => (x._id === n._id ? { ...x, read: true } : x)) }));
  }

  return (
    <div className="container page narrow">
      <div className="page-head">
        <div><span className="eyebrow">Inbox</span><h1>Notifications</h1></div>
        {data?.unread > 0 && <button className="btn btn-secondary" onClick={markAll}><CheckCheck size={17} />Mark all as read</button>}
      </div>
      {error ? <ErrorState message={error} onRetry={reload} />
        : loading ? <div className="stack">{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={64} r={14} />)}</div>
        : data.items.length === 0 ? <EmptyState icon={Bell} title="You’re all caught up">Swap requests, acceptances and reviews will show up here.</EmptyState>
        : <div className="card" style={{ padding: 10 }}>{data.items.map((n) => <NotificationItem key={n._id} item={n} onClick={open} />)}</div>}
    </div>
  );
}
