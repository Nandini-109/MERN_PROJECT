import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Compass, Heart, LayoutDashboard, LogOut, Menu, MessageSquare, Moon, Repeat, ShieldCheck, Sun, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api';
import Avatar from './Avatar';
import NotificationBell from './NotificationBell';

export const Brand = () => (
  <Link to="/" className="brand" aria-label="SkillSwap home">
    <span className="brand-mark"><ArrowLeftRight size={18} strokeWidth={2.6} /></span>
    Skill<b>Swap</b>
  </Link>
);

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const userRef = useRef(null);

  const onHero = pathname === '/' && !scrolled;

  useEffect(() => { setMenuOpen(false); setUserMenu(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    if (!userMenu) return undefined;
    const away = (e) => { if (!userRef.current?.contains(e.target)) setUserMenu(false); };
    const esc = (e) => e.key === 'Escape' && setUserMenu(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [userMenu]);

  // Unread chat badge (polled lightly; skipped while the tab is hidden).
  useEffect(() => {
    if (!user) { setUnreadMsgs(0); return undefined; }
    const load = () => { if (!document.hidden) api.get('/messages/unread-count').then((r) => setUnreadMsgs(r.data.unread)).catch(() => {}); };
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [user, pathname]);

  const links = user ? [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/discover', label: 'Discover', icon: Compass },
    { to: '/requests', label: 'Swaps', icon: Repeat },
    { to: '/messages', label: 'Messages', icon: MessageSquare, badge: unreadMsgs }
  ] : [];

  const doLogout = () => { logout(true); nav('/'); };
  const person = { name: user?.name, avatar: profile?.avatar };

  return (
    <header className={`navbar ${onHero ? 'on-hero' : ''}`}>
      <div className="container nav-inner">
        <Brand />
        <nav className="nav-links" aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {l.label}{l.badge > 0 && <span className="count-dot">{l.badge}</span>}
            </NavLink>
          ))}
          {!user && <a className="nav-link" href="/#how">How it works</a>}
        </nav>

        <div className="nav-actions">
          <button className="icon-btn nav-theme" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {user ? (
            <>
              <NotificationBell />
              <div ref={userRef} style={{ position: 'relative' }} className="nav-hide-sm">
                <button className="user-trigger" onClick={() => setUserMenu((o) => !o)} aria-expanded={userMenu} aria-haspopup="menu">
                  <Avatar user={person} size={32} />
                  <span style={{ fontSize: 14, fontWeight: 600, maxWidth: 110 }} className="truncate">{(user.name || 'Me').split(' ')[0]}</span>
                </button>
                {userMenu && (
                  <div className="dropdown" role="menu">
                    <div style={{ padding: '8px 12px 10px' }}>
                      <b className="truncate" style={{ display: 'block' }}>{user.name || 'Member'}</b>
                      <small className="muted truncate" style={{ display: 'block' }}>{user.email}</small>
                    </div>
                    <hr />
                    <Link className="dropdown-item" role="menuitem" to="/profile"><User size={17} />My profile</Link>
                    <Link className="dropdown-item" role="menuitem" to="/favorites"><Heart size={17} />Saved people</Link>
                    {user.role === 'admin' && <Link className="dropdown-item" role="menuitem" to="/admin"><ShieldCheck size={17} />Admin panel</Link>}
                    <hr />
                    <button className="dropdown-item danger" role="menuitem" onClick={doLogout}><LogOut size={17} />Log out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm nav-hide-sm" style={onHero ? { color: '#cdd3e6' } : undefined}>Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm"><span className="cta-long">Get started</span><span className="cta-short">Join</span></Link>
            </>
          )}

          <button className="icon-btn nav-burger" onClick={() => setMenuOpen((o) => !o)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu" style={{ color: 'var(--text)' }}>
          {user ? (
            <>
              <div className="row" style={{ padding: '4px 8px 12px' }}>
                <Avatar user={person} size={44} />
                <div><b>{user.name || 'Member'}</b><small className="muted" style={{ display: 'block' }}>{user.email}</small></div>
              </div>
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ color: 'var(--text)' }}>
                  <l.icon size={20} />{l.label}{l.badge > 0 && <span className="count-dot">{l.badge}</span>}
                </NavLink>
              ))}
              <NavLink to="/favorites" className="nav-link" style={{ color: 'var(--text)' }}><Heart size={20} />Saved people</NavLink>
              <NavLink to="/profile" className="nav-link" style={{ color: 'var(--text)' }}><User size={20} />My profile</NavLink>
              {user.role === 'admin' && <NavLink to="/admin" className="nav-link" style={{ color: 'var(--text)' }}><ShieldCheck size={20} />Admin panel</NavLink>}
              <hr />
              <button className="nav-link" onClick={toggle} style={{ color: 'var(--text)' }}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}{theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
              <button className="nav-link" onClick={doLogout} style={{ color: 'var(--on-rose)' }}><LogOut size={20} />Log out</button>
            </>
          ) : (
            <>
              <a className="nav-link" href="/#how" style={{ color: 'var(--text)' }}>How it works</a>
              <Link className="nav-link" to="/login" style={{ color: 'var(--text)' }}>Log in</Link>
              <button className="nav-link" onClick={toggle} style={{ color: 'var(--text)' }}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}{theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
              <Link className="btn btn-primary btn-lg" to="/register" style={{ marginTop: 12 }}>Create free account</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
