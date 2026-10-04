import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass, Heart, SearchX, SlidersHorizontal, X } from 'lucide-react';
import api, { errMsg } from '../api';
import { useToast } from '../context/FeedbackContext';
import useAsync from '../hooks/useAsync';
import useDebounce from '../hooks/useDebounce';
import useDocumentTitle from '../hooks/useDocumentTitle';
import SearchBox from '../components/SearchBox';
import UserCard from '../components/UserCard';
import RequestModal from '../components/RequestModal';
import { CardSkeleton, EmptyState, ErrorState, Pagination } from '../components/ui';
import { AVAILABILITY, LEVELS } from '../lib/utils';

const SORTS = [['match', 'Best match'], ['rating', 'Top rated'], ['newest', 'Newest'], ['name', 'Name A–Z']];
const PAGE_SIZE = 9;

export default function Discover() {
  useDocumentTitle('Discover');
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  // Filters live in the URL so results are shareable and survive refresh / back button.
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const level = params.get('level') || '';
  const sort = params.get('sort') || 'match';
  const savedOnly = params.get('saved') === 'true';
  const page = parseInt(params.get('page'), 10) || 1;
  const availability = useMemo(() => (params.get('availability') || '').split(',').filter(Boolean), [params]);

  const [text, setText] = useState(q);
  const debouncedText = useDebounce(text, 400);
  const [target, setTarget] = useState(null);
  const [showFilters, setShowFilters] = useState(!!(level || availability.length || savedOnly));

  const update = useCallback((changes, resetPage = true) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([k, v]) => { if (v === '' || v === false || v == null) next.delete(k); else next.set(k, v); });
      if (resetPage) next.delete('page');
      return next;
    }, { replace: true });
  }, [setParams]);

  // Typing (debounced) updates the URL; external URL changes (e.g. "clear") update the box.
  useEffect(() => { if (debouncedText.trim() !== q) update({ q: debouncedText.trim() }); }, [debouncedText]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setText((prev) => (prev.trim() === q ? prev : q)); }, [q]);

  const cats = useAsync(() => api.get('/skills/categories').then((r) => r.data), []);
  const key = params.toString();
  const results = useAsync(() => api.get('/users/discover', {
    params: { q, category, level, sort, page, limit: PAGE_SIZE, availability: availability.join(','), favorites: savedOnly || undefined }
  }).then((r) => r.data), [key]);

  async function toggleFavorite(user) {
    const apply = (flag) => results.setData((d) => d && ({ ...d, users: d.users.map((u) => (u._id === user._id ? { ...u, isFavorite: flag } : u)) }));
    apply(!user.isFavorite); // optimistic
    try {
      const { data } = await api.post(`/users/${user._id}/favorite`);
      apply(data.isFavorite);
      toast.success(data.isFavorite ? `${user.name} saved` : `${user.name} removed from saved`);
      if (savedOnly && !data.isFavorite) results.reload({ silent: true });
    } catch (e) { apply(user.isFavorite); toast.error(errMsg(e)); }
  }

  const activeFilters = [category, level, availability.length, savedOnly, q].filter(Boolean).length;
  const clearAll = () => { setText(''); setParams({}, { replace: true }); };
  const toggleAvail = (a) => update({ availability: (availability.includes(a) ? availability.filter((x) => x !== a) : [...availability, a]).join(',') });
  const data = results.data;

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Discover</span>
          <h1>Find your skill match</h1>
          <p>Search by skill, name or interest – then request a swap with someone whose strengths fit your goals.</p>
        </div>
      </div>

      <section className="card hero-search">
        <div className="search-row">
          <SearchBox value={text} onChange={setText} onSubmit={(v) => update({ q: v.trim() })} placeholder="Search Python, UI design, guitar, or a person…" />
          <button className={`btn btn-secondary btn-lg ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
            <SlidersHorizontal size={18} />Filters
          </button>
        </div>

        <div className="cat-scroll" role="group" aria-label="Skill categories">
          <button className={`filter-chip ${!category ? 'active' : ''}`} onClick={() => update({ category: '' })}>All categories</button>
          {(cats.data || []).map((c) => (
            <button key={c.category} className={`filter-chip ${category === c.category ? 'active' : ''}`} onClick={() => update({ category: category === c.category ? '' : c.category })} aria-pressed={category === c.category}>
              {c.category}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="filter-row">
            <select className="select sm" value={level} onChange={(e) => update({ level: e.target.value })} aria-label="Skill level">
              <option value="">Any level</option>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
            {AVAILABILITY.map((a) => (
              <button key={a} className={`filter-chip ${availability.includes(a) ? 'active' : ''}`} onClick={() => toggleAvail(a)} aria-pressed={availability.includes(a)}>{a}</button>
            ))}
            <button className={`filter-chip ${savedOnly ? 'active' : ''}`} onClick={() => update({ saved: !savedOnly })} aria-pressed={savedOnly}><Heart size={15} />Saved only</button>
          </div>
        )}
      </section>

      <div className="results-bar">
        <p className="text-2" aria-live="polite">
          {results.loading && !data ? 'Searching…' : data ? <><b>{data.total}</b> {data.total === 1 ? 'person' : 'people'} found</> : ''}
        </p>
        <div className="row">
          {activeFilters > 0 && <button className="btn btn-ghost btn-sm" onClick={clearAll}><X size={15} />Clear all filters</button>}
          <label className="row small text-2" style={{ gap: 8 }}>Sort by
            <select className="select sm" value={sort} onChange={(e) => update({ sort: e.target.value })} style={{ width: 'auto' }}>
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>
      </div>

      {results.error ? <ErrorState message={results.error} onRetry={results.reload} />
        : results.loading && !data ? <div className="grid grid-3">{Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}</div>
        : data.users.length === 0 ? (
          <EmptyState icon={q || activeFilters ? SearchX : Compass} title={activeFilters ? 'No one matches those filters' : 'No members yet'}
            action={activeFilters > 0 && <button className="btn btn-primary" onClick={clearAll}>Clear filters</button>}>
            {activeFilters ? 'Try a different keyword, pick another category, or loosen your filters.' : 'Be the first to add your skills – others will find you here.'}
          </EmptyState>
        ) : (
          <div style={{ opacity: results.loading ? 0.55 : 1, transition: 'opacity .2s' }}>
            <div className="grid grid-3">
              {data.users.map((u) => <UserCard key={u._id} user={u} onRequest={setTarget} onToggleFavorite={toggleFavorite} />)}
            </div>
            <Pagination page={data.page} pages={data.pages} onChange={(p) => { update({ page: p > 1 ? p : '' }, false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          </div>
        )}

      {target && <RequestModal target={target} onClose={() => setTarget(null)} />}
    </div>
  );
}
