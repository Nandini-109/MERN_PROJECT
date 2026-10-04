import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { LEVELS } from '../lib/utils';
import useSkillCatalog from '../hooks/useSkillCatalog';

/** Input + datalist suggestions (from the catalogue) + optional level picker. */
export default function SkillAdder({ withLevel = false, existing = [], onAdd, placeholder = 'e.g. Python', busy = false }) {
  const listId = useId();
  const catalog = useSkillCatalog();
  const [name, setName] = useState('');
  const [level, setLevel] = useState('Intermediate');
  const [error, setError] = useState('');

  function submit(e) {
    e?.preventDefault();
    const value = name.trim();
    if (!value) return setError('Type a skill name first');
    if (value.length > 40) return setError('Keep skill names under 40 characters');
    if (existing.some((s) => s.toLowerCase() === value.toLowerCase())) return setError('You already added that skill');
    setError('');
    onAdd(value, level);
    setName('');
  }

  return (
    <div>
      <div className="add-skill">
        <input className={`input ${error ? 'invalid' : ''}`} list={listId} value={name} placeholder={placeholder}
          aria-label="Skill name" onChange={(e) => { setName(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && submit(e)} />
        <datalist id={listId}>{catalog.map((s) => <option key={s._id} value={s.name}>{s.category}</option>)}</datalist>
        {withLevel && (
          <select className="select" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Skill level">
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
        )}
        <button type="button" className="btn btn-dark" onClick={submit} disabled={busy}><Plus size={16} />Add</button>
      </div>
      {error && <p className="error-text small" role="alert" style={{ color: 'var(--on-rose)', marginTop: 6 }}>{error}</p>}
    </div>
  );
}
