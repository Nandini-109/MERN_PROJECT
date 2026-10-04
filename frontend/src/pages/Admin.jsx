import { useState } from 'react';
import { Layers, Plus, Trash2, Users } from 'lucide-react';
import api, { errMsg } from '../api';
import { useConfirm, useToast } from '../context/FeedbackContext';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Avatar from '../components/Avatar';
import Field from '../components/Field';
import { ErrorBanner, ErrorState, Skeleton, Spinner, StatCard } from '../components/ui';
import { Repeat, CheckCircle2 } from 'lucide-react';

const empty = { name: '', category: '', description: '' };

export default function Admin() {
  useDocumentTitle('Admin');
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, error, reload } = useAsync(async () => {
    const [u, s, st] = await Promise.all([api.get('/users/admin/all'), api.get('/skills'), api.get('/stats/admin')]);
    return { users: u.data, skills: s.data, stats: st.data };
  }, []);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  async function addSkill(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim()) return setFormError('Skill name and category are required');
    setBusy(true); setFormError('');
    try { await api.post('/skills', form); setForm(empty); toast.success('Skill added'); reload({ silent: true }); }
    catch (err) { setFormError(errMsg(err)); }
    finally { setBusy(false); }
  }

  async function remove(kind, item) {
    const label = kind === 'users' ? item.name : item.name;
    if (!(await confirm({ title: `Delete ${kind === 'users' ? 'user' : 'skill'}?`, message: `“${label}” will be permanently removed${kind === 'users' ? ', along with their swaps, messages and reviews' : ''}.`, confirmText: 'Delete', danger: true }))) return;
    try { await api.delete(kind === 'users' ? `/users/admin/${item._id}` : `/skills/${item._id}`); toast.success('Deleted'); reload({ silent: true }); }
    catch (err) { toast.error(errMsg(err)); }
  }

  if (error) return <div className="container page"><ErrorState message={error} onRetry={reload} /></div>;
  const categories = [...new Set((data?.skills || []).map((s) => s.category))];

  return (
    <div className="container page">
      <div className="page-head"><div><span className="eyebrow">Admin panel</span><h1>Platform management</h1><p>Manage members and the skill catalogue.</p></div></div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        {loading ? [0, 1, 2, 3].map((i) => <Skeleton key={i} h={120} r={20} />) : <>
          <StatCard icon={Users} tone="indigo" value={data.stats.users} label="Members" />
          <StatCard icon={Layers} tone="amber" value={data.stats.skills} label="Catalogue skills" />
          <StatCard icon={Repeat} tone="teal" value={data.stats.requests} label="Swap requests" />
          <StatCard icon={CheckCircle2} tone="rose" value={data.stats.completed} label="Completed swaps" />
        </>}
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <section className="card stack">
          <div className="card-head" style={{ marginBottom: 0 }}><h3>Add a skill</h3></div>
          <form className="stack" onSubmit={addSkill} noValidate>
            <ErrorBanner>{formError}</ErrorBanner>
            <Field label="Skill name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rust" />
            <Field label="Category" list="admin-cats" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Programming" />
            <datalist id="admin-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            <Field label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
            <button className="btn btn-primary" disabled={busy}>{busy ? <Spinner /> : <Plus size={16} />}Add skill</button>
          </form>
          <div className="card-section-title" style={{ marginTop: 8 }}>Existing skills ({data?.skills.length ?? '…'})</div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {data?.skills.map((s) => (
              <div className="list-row" key={s._id}>
                <div className="grow"><b>{s.name}</b><small>{s.category}</small></div>
                <button className="icon-btn" aria-label={`Delete ${s.name}`} onClick={() => remove('skills', s)}><Trash2 size={17} /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h3>Members</h3></div>
          <div style={{ maxHeight: 640, overflowY: 'auto' }}>
            {loading ? <Skeleton h={200} r={14} /> : data.users.map((u) => (
              <div className="list-row" key={u._id}>
                <Avatar user={u} size={40} />
                <div className="grow" style={{ minWidth: 0 }}><b className="truncate" style={{ display: 'block' }}>{u.name}</b><small className="truncate">{u.email}</small></div>
                {u.role === 'admin' ? <span className="badge info">Admin</span> : <button className="icon-btn" aria-label={`Delete ${u.name}`} onClick={() => remove('users', u)}><Trash2 size={17} /></button>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
