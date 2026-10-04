import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, User, X } from 'lucide-react';
import api from '../api';
import useDebounce from '../hooks/useDebounce';

/** Search input with live suggestions (skills + people). Arrow keys / Enter / Esc supported. */
export default function SearchBox({ value, onChange, onSubmit, placeholder }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrap = useRef(null);
  const nav = useNavigate();
  const debounced = useDebounce(value, 250);

  useEffect(() => {
    let cancelled = false;
    if (!debounced.trim() || !open) { setItems([]); return undefined; }
    api.get('/skills/suggest', { params: { q: debounced.trim() } })
      .then((r) => { if (!cancelled) { setItems(r.data); setActive(-1); } })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, [debounced, open]);

  useEffect(() => {
    const away = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  function pick(item) {
    setOpen(false);
    if (item.type === 'person') nav(`/u/${item.id}`);
    else { onChange(item.label); onSubmit(item.label); }
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && active >= 0 && items[active]) pick(items[active]);
      else { setOpen(false); onSubmit(value); }
    }
  }

  return (
    <div className="search-box" ref={wrap}>
      <div className="input-wrap">
        <Search size={20} className="lead-icon" />
        <input className="input has-icon has-trail" value={value} placeholder={placeholder} role="combobox" aria-expanded={open && items.length > 0}
          aria-autocomplete="list" aria-label="Search skills or people"
          onChange={(e) => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown} />
        {value && <button type="button" className="trail-btn" aria-label="Clear search" onClick={() => { onChange(''); onSubmit(''); }}><X size={18} /></button>}
      </div>
      {open && items.length > 0 && (
        <div className="suggest" role="listbox">
          {items.map((it, i) => (
            <button key={`${it.type}-${it.label}-${i}`} role="option" aria-selected={i === active} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(it)}>
              {it.type === 'skill' ? <Sparkles size={16} color="var(--accent-text)" /> : <User size={16} color="var(--on-indigo)" />}
              <span>{it.label}</span><small>{it.hint}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
