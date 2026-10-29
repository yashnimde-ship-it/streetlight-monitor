import { Component } from 'react';

/** Keeps one broken page from blanking the whole app. Reset by changing `resetKey` (e.g. the route). */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card py-10 text-center">
        <p className="font-medium text-red-700">Something went wrong on this page</p>
        <p className="mt-1 text-sm text-slate-500">{this.state.error.message}</p>
        <button type="button" className="btn btn-secondary mt-4" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
