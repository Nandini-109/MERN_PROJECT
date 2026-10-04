import { AlertCircle, ChevronLeft, ChevronRight, Code, Palette, TrendingUp, Languages, Music, Briefcase, Leaf, Sparkles, Star, X } from 'lucide-react';
import { levelOf } from '../lib/utils';

export const Spinner = ({ large }) => <span className={`spinner ${large ? 'lg' : ''}`} role="status" aria-label="Loading" />;

export const PageLoader = () => <div className="page-loader"><Spinner large /></div>;

export const Skeleton = ({ w = '100%', h = 16, r, style }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />
);

export function CardSkeleton() {
  return (
    <div className="card" aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <Skeleton w={52} h={52} r="50%" />
        <div className="grow stack" style={{ gap: 8 }}><Skeleton w="60%" h={16} /><Skeleton w="40%" h={12} /></div>
      </div>
      <Skeleton h={12} /><Skeleton w="80%" h={12} />
      <div className="row"><Skeleton w={70} h={28} r={999} /><Skeleton w={90} h={28} r={999} /><Skeleton w={60} h={28} r={999} /></div>
      <Skeleton h={44} r={999} />
    </div>
  );
}

export function EmptyState({ icon: Icon = Sparkles, title, children, action }) {
  return (
    <div className="state">
      <div className="state-icon"><Icon size={26} /></div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div className="row">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state error" role="alert">
      <div className="state-icon"><AlertCircle size={26} /></div>
      <h3>We couldn’t load this</h3>
      <p>{message || 'Something went wrong. Please try again.'}</p>
      {onRetry && <div className="row"><button className="btn btn-secondary" onClick={() => onRetry()}>Try again</button></div>}
    </div>
  );
}

export const ErrorBanner = ({ children }) => children ? (
  <div className="form-error" role="alert"><AlertCircle size={18} style={{ flex: 'none', marginTop: 2 }} /><span>{children}</span></div>
) : null;

export function Stars({ value = 0, count, size = 15 }) {
  const rounded = Math.round(value);
  return (
    <span className="stars" aria-label={count ? `${value} out of 5 from ${count} reviews` : 'No reviews yet'}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= rounded && count ? '' : 'off'} fill={n <= rounded && count ? 'currentColor' : 'none'} />
      ))}
      <span className="stars-label">{count ? `${value.toFixed(1)} (${count})` : 'New'}</span>
    </span>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="star-input" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className={n <= value ? 'on' : ''} onClick={() => onChange(n)} role="radio" aria-checked={n === value} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
          <Star size={30} fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export const LevelDot = ({ level }) => <i className="level" data-l={level} title={level} />;

/** A skill the person teaches, with a level indicator. */
export const TeachChip = ({ user, skill, onRemove }) => {
  const level = levelOf(user, skill);
  return (
    <span className="chip" title={`${skill} · ${level}`}>
      <LevelDot level={level} />{skill}
      {onRemove && <button type="button" onClick={() => onRemove(skill)} aria-label={`Remove ${skill}`}><X size={12} /></button>}
    </span>
  );
};

export const LearnChip = ({ skill, onRemove }) => (
  <span className="chip learn">
    {skill}
    {onRemove && <button type="button" onClick={() => onRemove(skill)} aria-label={`Remove ${skill}`}><X size={12} /></button>}
  </span>
);

export const StatusBadge = ({ status }) => {
  const label = typeof status === 'string' && status ? status : 'unknown';
  return <span className={`badge ${label}`}>{label[0].toUpperCase() + label.slice(1)}</span>;
};

const CATEGORY_ICON = { Programming: Code, Design: Palette, 'Data & AI': TrendingUp, Languages, 'Music & Arts': Music, Business: Briefcase, Lifestyle: Leaf };
const CATEGORY_TONE = { Programming: 'indigo', Design: 'rose', 'Data & AI': 'teal', Languages: 'amber', 'Music & Arts': 'rose', Business: 'amber', Lifestyle: 'teal' };
export function CategoryIcon({ category, size = 22 }) {
  const Icon = CATEGORY_ICON[category] || Sparkles;
  return <div className={`stat-icon ${CATEGORY_TONE[category] || 'indigo'}`} style={{ width: 44, height: 44 }}><Icon size={size} /></div>;
}

export function StatCard({ icon: Icon, tone = 'amber', value, label }) {
  return (
    <div className="card stat hover">
      <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
      <div><strong>{value}</strong><span className="label-s">{label}</span></div>
    </div>
  );
}

export function ProgressRing({ percent = 0, size = 96, stroke = 9 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`${percent}% complete`}>
      <svg width={size} height={size}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle className="ring-bar" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c - (c * percent) / 100} />
      </svg>
      <span className="ring-label" style={{ fontSize: size * 0.24 }}>{percent}%</span>
    </div>
  );
}

export function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="chart" role="img" aria-label="Activity over the last 7 days">
      {data.map((d, i) => (
        <div className="chart-col" key={d.label + i}>
          <div className="chart-bar-wrap">
            <div className={`chart-bar ${d.count ? 'filled' : ''}`} data-v={d.count} style={{ height: `${Math.max((d.count / max) * 100, 3)}%`, animationDelay: `${i * 60}ms` }} />
          </div>
          <span>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.id} role="tab" className="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}>
          {t.label}{t.count > 0 && <span className="count-dot">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p += 1) nums.push(p);
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="page-btn" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft size={18} /></button>
      {nums[0] > 1 && <><button className="page-btn" onClick={() => onChange(1)}>1</button>{nums[0] > 2 && <span className="muted">…</span>}</>}
      {nums.map((p) => (
        <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} aria-current={p === page ? 'page' : undefined} onClick={() => onChange(p)}>{p}</button>
      ))}
      {nums[nums.length - 1] < pages && <>{nums[nums.length - 1] < pages - 1 && <span className="muted">…</span>}<button className="page-btn" onClick={() => onChange(pages)}>{pages}</button></>}
      <button className="page-btn" disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight size={18} /></button>
    </nav>
  );
}
