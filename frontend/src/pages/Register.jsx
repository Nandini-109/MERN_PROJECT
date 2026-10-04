import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Lock, Mail, Repeat, Sparkles, Star, User } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/FeedbackContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Field from '../components/Field';
import { ErrorBanner, Spinner } from '../components/ui';
import { AuthAside } from './Login';

function strength(pw) {
  let s = 0;
  if (pw.length >= 6) s += 1;
  if (pw.length >= 10) s += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s += 1;
  return pw ? Math.max(s, 1) : 0;
}

export default function Register() {
  useDocumentTitle('Create account');
  const { user, login } = useAuth();
  const toast = useToast();
  const [justRegistered, setJustRegistered] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: '' })); };
  const level = strength(form.password);

  if (user) return <Navigate to={justRegistered ? '/profile' : '/dashboard'} replace />;

  async function submit(e) {
    e.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Please enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (form.password.length < 6) next.password = 'Use at least 6 characters';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true); setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      login(data);
      setJustRegistered(true); // new members continue to profile setup; returning visitors go to the dashboard
      toast.success('Account created! Let’s set up your profile.');
    } catch (err) {
      setError(errMsg(err, 'Registration failed. Please try again.'));
      setBusy(false);
    }
  }

  return (
    <section className="auth">
      <AuthAside title="Your next skill is one" accent="swap away." points={[
        [Sparkles, 'List what you can teach and what you want to learn'],
        [Repeat, 'Get matched with people who complement your skills'],
        [Star, 'Build a reputation through ratings and reviews']
      ]} />
      <div className="auth-main">
        <div className="auth-card">
          <h1>Create your account</h1>
          <p className="sub">Free forever. Takes less than a minute.</p>
          <form onSubmit={submit} noValidate>
            <ErrorBanner>{error}</ErrorBanner>
            <Field label="Full name" icon={User} autoComplete="name" placeholder="Riya Sharma" value={form.name} onChange={set('name')} error={errors.name} maxLength={60} />
            <Field label="Email" icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} />
            <div>
              <Field label="Password" icon={Lock} type="password" autoComplete="new-password" placeholder="At least 6 characters" value={form.password} onChange={set('password')} error={errors.password} />
              <div className="strength" data-level={level} aria-hidden="true"><i /><i /><i /><i /></div>
              {form.password && <small className="muted">Password strength: {['', 'Weak', 'Okay', 'Good', 'Strong'][level]}</small>}
            </div>
            <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy && <Spinner />}{busy ? 'Creating account…' : 'Create account'}</button>
          </form>
          <p className="auth-foot">Already a member? <Link to="/login">Log in</Link></p>
        </div>
      </div>
    </section>
  );
}
