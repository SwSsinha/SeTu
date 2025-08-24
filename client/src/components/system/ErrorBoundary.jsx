import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="border border-destructive/40 bg-destructive/5 rounded-md p-4 text-sm" role="alert">
          <p className="font-semibold mb-1">Something went wrong.</p>
          <pre className="text-[11px] overflow-auto max-h-40 whitespace-pre-wrap break-words">{String(this.state.error.message || this.state.error)}</pre>
          <button
            type="button"
            className="mt-3 px-2 py-1 border rounded text-[11px] hover:bg-muted"
            onClick={() => { this.setState({ error: null }); location.reload(); }}
          >Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
