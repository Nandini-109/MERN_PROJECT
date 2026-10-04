import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import api, { errMsg } from '../api';
import { useToast } from '../context/FeedbackContext';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import UserCard from '../components/UserCard';
import RequestModal from '../components/RequestModal';
import { CardSkeleton, EmptyState, ErrorState } from '../components/ui';
import { useState } from 'react';

export default function Favorites() {
  useDocumentTitle('Saved people');
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsync(() => api.get('/users/favorites').then((r) => r.data), []);
  const [target, setTarget] = useState(null);

  async function remove(user) {
    try {
      await api.post(`/users/${user._id}/favorite`);
      setData((list) => list.filter((u) => u._id !== user._id));
      toast.success(`${user.name} removed from saved`);
    } catch (e) { toast.error(errMsg(e)); }
  }

  return (
    <div className="container page">
      <div className="page-head"><div><span className="eyebrow">Favourites</span><h1>Saved people</h1><p>Members you’d like to learn from – all in one place.</p></div></div>
      {error ? <ErrorState message={error} onRetry={reload} />
        : loading ? <div className="grid grid-3">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
        : data.length === 0 ? <EmptyState icon={Heart} title="No saved people yet" action={<Link to="/discover" className="btn btn-primary">Discover people</Link>}>Tap the heart on any profile card to bookmark it for later.</EmptyState>
        : <div className="grid grid-3">{data.map((u) => <UserCard key={u._id} user={{ ...u, isFavorite: true }} onRequest={setTarget} onToggleFavorite={remove} />)}</div>}
      {target && <RequestModal target={target} onClose={() => setTarget(null)} />}
    </div>
  );
}
