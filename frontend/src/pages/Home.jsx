import { Link } from 'react-router-dom';
import { ArrowLeftRight, ArrowRight, Bell, BookOpen, Heart, MessageSquare, Repeat, Search, Sparkles, Star, UserCircle, Zap } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import useAsync from '../hooks/useAsync';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Avatar from '../components/Avatar';
import { CategoryIcon } from '../components/ui';

const FALLBACK_CATEGORIES = ['Programming', 'Design', 'Data & AI', 'Languages', 'Music & Arts', 'Business', 'Lifestyle'].map((category) => ({ category, skills: 0, teachers: 0 }));

const STEPS = [
  { icon: UserCircle, title: 'Build your skill profile', text: 'List what you can teach and what you want to learn, add your level and when you’re free.' },
  { icon: Search, title: 'Find your perfect match', text: 'Search by skill or browse categories. We highlight people whose strengths complement yours.' },
  { icon: Repeat, title: 'Swap, chat and grow', text: 'Send a request, chat once it’s accepted, learn from each other and leave a review.' }
];

const FEATURES = [
  { icon: Sparkles, tone: 'amber', title: 'Smart matching', text: 'Mutual matches surface first – people who teach what you want and want what you teach.' },
  { icon: Star, tone: 'indigo', title: 'Ratings & reviews', text: 'Every completed swap can be reviewed, so you always know who you’re learning from.' },
  { icon: MessageSquare, tone: 'teal', title: 'Built-in chat', text: 'Plan sessions in a private chat that unlocks as soon as a swap is accepted.' },
  { icon: BookOpen, tone: 'rose', title: 'Levels & availability', text: 'Skill-level badges and availability slots make it easy to find the right partner.' },
  { icon: Heart, tone: 'amber', title: 'Save favourites', text: 'Bookmark people you’d like to learn from and come back to them any time.' },
  { icon: Bell, tone: 'teal', title: 'Live notifications', text: 'Never miss a request, acceptance or review with instant in-app notifications.' }
];

export default function Home() {
  useDocumentTitle('');
  const { user } = useAuth();
  const { data: stats } = useAsync(() => api.get('/stats/public').then((r) => r.data), []);
  const { data: cats } = useAsync(() => api.get('/skills/categories').then((r) => r.data), []);
  const categories = cats?.length ? cats : FALLBACK_CATEGORIES;

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="pill fade-up"><i>New</i> Peer-to-peer skill exchange</span>
            <h1 className="fade-up d1">Trade what you know.<br /><span className="serif">Learn what’s next.</span></h1>
            <p className="hero-lead fade-up d2">
              SkillSwap is a community where people teach each other. Offer a skill you’re good at, request one you want to learn, and swap — no money, just mutual growth.
            </p>
            <div className="hero-cta fade-up d3">
              <Link to={user ? '/discover' : '/register'} className="btn btn-primary btn-lg">{user ? 'Discover skills' : 'Get started — it’s free'}<ArrowRight size={18} /></Link>
              {user
                ? <Link to="/dashboard" className="btn btn-light btn-lg">Open dashboard</Link>
                : <a href="#how" className="btn btn-light btn-lg">See how it works</a>}
            </div>
            <div className="hero-proof fade-up d4">
              <div className="avatar-stack">
                {['Aarav', 'Mira', 'Kabir', 'Sana'].map((n) => <Avatar key={n} user={{ name: n }} size={34} />)}
              </div>
              <span>{stats?.members ? <><b style={{ color: '#fff' }}>{stats.members}</b> learners and teachers already swapping</> : 'Join a growing community of learners'}</span>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <span className="float-chip a"><Sparkles size={16} color="var(--amber-soft)" />Mutual match found</span>
            <div className="swap-card">
              <div className="swap-person"><Avatar user={{ name: 'Riya Sharma' }} size={46} /><div><b>Riya</b><small>Teaches Python</small></div><span className="tag">Advanced</span></div>
              <div className="swap-arrow"><span><ArrowLeftRight size={20} strokeWidth={2.5} /></span></div>
              <div className="swap-person"><Avatar user={{ name: 'Kabir Mehta' }} size={46} /><div><b>Kabir</b><small>Teaches UI/UX Design</small></div><span className="tag">Expert</span></div>
              <div className="swap-foot"><span>Example swap</span><strong>Python ⇄ UI/UX</strong></div>
            </div>
            <span className="float-chip b"><Star size={16} color="var(--amber-soft)" fill="var(--amber-soft)" />5.0 · Great teacher</span>
          </div>
        </div>
      </section>

      {/* ---------- Live numbers ---------- */}
      {stats && (
        <div className="container strip">
          <div className="strip-card">
            <div><strong>{stats.members}</strong><span>Members</span></div>
            <div><strong>{stats.skills}</strong><span>Skills to explore</span></div>
            <div><strong>{stats.exchanges}</strong><span>Active & completed swaps</span></div>
          </div>
        </div>
      )}

      {/* ---------- How it works ---------- */}
      <section className="section" id="how">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>Three steps from curious to confident</h2>
            <p>No subscriptions, no tutors to book. Just people helping each other get better.</p>
          </div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step" key={s.title}>
                <span className="step-num">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Categories ---------- */}
      <section className="section" id="categories">
        <div className="container">
          <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 32 }}>
            <div className="section-head" style={{ margin: 0 }}>
              <span className="eyebrow">Explore</span>
              <h2>Skills for every curiosity</h2>
            </div>
            <Link to={user ? '/discover' : '/register'} className="link-more">Browse everything <ArrowRight size={15} /></Link>
          </div>
          <div className="cat-grid">
            {categories.slice(0, 8).map((c) => (
              <Link key={c.category} to={`/discover?category=${encodeURIComponent(c.category)}`} className="cat-tile">
                <CategoryIcon category={c.category} />
                <div>
                  <b>{c.category}</b><br />
                  <small>{c.skills ? `${c.skills} skills · ${c.teachers} teachers` : 'Explore skills'}</small>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Why SkillSwap</span>
            <h2>Everything you need to learn from each other</h2>
            <p>Designed around trust, simplicity and fair exchange.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div className="feature" key={f.title}>
                <div className={`stat-icon ${f.tone}`}><f.icon size={20} /></div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="container cta-band" style={{ marginBottom: 88 }}>
        <div className="dark-card cta-inner">
          <h2>Ready to swap your first skill?</h2>
          <p>Create your free profile in a minute and meet people who can teach you something new.</p>
          <Link to={user ? '/discover' : '/register'} className="btn btn-primary btn-lg"><Zap size={18} />{user ? 'Find a match' : 'Join SkillSwap'}</Link>
        </div>
      </section>
    </>
  );
}
