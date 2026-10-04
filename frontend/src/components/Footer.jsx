import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brand } from './Navbar';

export default function Footer() {
  const { user } = useAuth();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Brand />
            <p className="text-2 small" style={{ marginTop: 14, maxWidth: 340 }}>
              A peer-to-peer skill exchange community. Teach what you know, learn what you don’t — no money required.
            </p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link to={user ? '/discover' : '/register'}>Discover skills</Link></li>
              <li><a href="/#how">How it works</a></li>
              <li><a href="/#categories">Categories</a></li>
            </ul>
          </div>
          <div>
            <h4>Account</h4>
            <ul>
              {user ? (
                <>
                  <li><Link to="/dashboard">Dashboard</Link></li>
                  <li><Link to="/profile">My profile</Link></li>
                  <li><Link to="/requests">My swaps</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/login">Log in</Link></li>
                  <li><Link to="/register">Create account</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} SkillSwap</span>
          <span>Built with MongoDB · Express · React · Node.js</span>
        </div>
      </div>
    </footer>
  );
}
