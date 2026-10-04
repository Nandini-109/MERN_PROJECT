import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { PageLoader } from './components/ui';
import ErrorBoundary from './components/ErrorBoundary';

// Route-level code splitting: each page is downloaded only when first visited.
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Discover = lazy(() => import('./pages/Discover'));
const Profile = lazy(() => import('./pages/Profile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Requests = lazy(() => import('./pages/Requests'));
const Messages = lazy(() => import('./pages/Messages'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Admin = lazy(() => import('./pages/Admin'));
const NotFound = lazy(() => import('./pages/NotFound'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Protected({ children, admin = false }) {
  const { user, signedOut } = useAuth();
  const location = useLocation();
  if (!user && signedOut) return <Navigate to="/" replace />; // deliberate logout -> home
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (admin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user } = useAuth();
  const { state } = useLocation();
  // Honour the page the visitor originally asked for (set by <Protected>) after they log in.
  return user ? <Navigate to={state?.from || '/dashboard'} replace /> : children;
}

export default function App() {
  const location = useLocation();
  // Only the first path segment keys the transition so query-string changes don't replay it.
  const pageKey = location.pathname.split('/')[1] || 'home';

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to content</a>
      <ScrollToTop />
      <Navbar />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        <Suspense fallback={<PageLoader />}>
          <div key={pageKey} className="page-enter">
            <ErrorBoundary resetKey={location.pathname}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
              <Route path="/discover" element={<Protected><Discover /></Protected>} />
              <Route path="/u/:id" element={<Protected><UserProfile /></Protected>} />
              <Route path="/profile" element={<Protected><Profile /></Protected>} />
              <Route path="/requests" element={<Protected><Requests /></Protected>} />
              <Route path="/messages" element={<Protected><Messages /></Protected>} />
              <Route path="/messages/:exchangeId" element={<Protected><Messages /></Protected>} />
              <Route path="/favorites" element={<Protected><Favorites /></Protected>} />
              <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
              <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </ErrorBoundary>
          </div>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
