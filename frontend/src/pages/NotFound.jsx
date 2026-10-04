import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <section className="nf container">
      <div>
        <div className="big">404</div>
        <h1>This page took a different path</h1>
        <p>The page you’re looking for doesn’t exist or has moved. Let’s get you back to swapping skills.</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link to="/" className="btn btn-dark"><Home size={17} />Back to home</Link>
          <Link to="/discover" className="btn btn-secondary"><Compass size={17} />Discover skills</Link>
        </div>
      </div>
    </section>
  );
}
