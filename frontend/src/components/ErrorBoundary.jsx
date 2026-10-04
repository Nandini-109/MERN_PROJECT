import { Component } from 'react';
import { AlertCircle } from 'lucide-react';

/** Catches render errors in a page so one bad record can't blank the whole app. */
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidCatch(error) { console.error('Page crashed:', error); }

  componentDidUpdate(prev) {
    // Leaving the broken page (resetKey changes) clears the error state.
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="container page">
        <div className="state error" role="alert">
          <div className="state-icon"><AlertCircle size={26} /></div>
          <h3>This page hit a problem</h3>
          <p>Something unexpected happened while showing this page. Your data is safe – try again, or head back to the dashboard.</p>
          <div className="row">
            <button className="btn btn-primary" onClick={() => this.setState({ failed: false })}>Try again</button>
            <a className="btn btn-secondary" href="/dashboard">Go to dashboard</a>
          </div>
        </div>
      </div>
    );
  }
}
