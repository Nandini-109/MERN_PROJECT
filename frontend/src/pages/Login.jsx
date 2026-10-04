import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Lock, Mail, ShieldCheck, Users, Zap } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/FeedbackContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Field from '../components/Field';
import { ErrorBanner, Spinner } from '../components/ui';

export function AuthAside({ title, accent, points }) {
  return (
    <aside className="auth-aside">
      <span className="brand" style={{ color: '#fff' }}><span className="brand-mark"><ArrowLeftRight size={18} strokeWidth={2.6} /></span>Skill<b style={{ color: 'var(--amber-soft)' }}>Swap</b></span>
      <div>
        <h2>{title} <span className="serif">{accent}</span></h2>
        <ul className="auth-points">
          {points.map(([Icon, text]) => <li key={text}><span><Icon size={17} /></span>{text}</li>)}
        </ul>
      </div>
      <small style={{ color: '#7d86a3' }}>Trade skills. Grow together.</small>
    </aside>
  );
}

export default function Login() {
  useDocumentTitle('Log in');
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: '' })); };

  async function submit(e) {
    e.preventDefault();
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Enter your password';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true); setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      nav(state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(errMsg(err, 'Login failed. Please try again.'));
      setBusy(false);
    }
  }

  return (
    <section className="auth">
      <AuthAside title="Welcome back to the" accent="swap." points={[
        [Users, 'Pick up conversations with your learning partners'],
        [Zap, 'See new matches and swap requests at a glance'],
        [ShieldCheck, 'Your data stays private and secure']
      ]} />
      <div className="auth-main">
        <div className="auth-card">
          <h1>Log in</h1>
          <p className="sub">Enter your details to continue your skill journey.</p>
          <form onSubmit={submit} noValidate>
            <ErrorBanner>{error}</ErrorBanner>
            <Field label="Email" icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} />
            <Field label="Password" icon={Lock} type="password" autoComplete="current-password" placeholder="Your password" value={form.password} onChange={set('password')} error={errors.password} />
            <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy && <Spinner />}{busy ? 'Signing in…' : 'Log in'}</button>
          </form>
          <p className="auth-foot">New to SkillSwap? <Link to="/register">Create an account</Link></p>
        </div>
      </div>
    </section>
  );
}
