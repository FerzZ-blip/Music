import { Component } from 'react';
import { Warning } from '@phosphor-icons/react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <Warning size={32} className="text-rose-400 mb-3" />
          <p className="text-sm text-warm-500 dark:text-warm-400">something glitched</p>
          <p className="text-xs text-warm-400 dark:text-warm-500 mt-1">try refreshing</p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="mt-4 text-xs font-medium text-rose-500 hover:text-rose-600 bg-rose-100/60 hover:bg-rose-200/60 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 px-4 py-2 rounded-xl transition-all"
          >
            refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
