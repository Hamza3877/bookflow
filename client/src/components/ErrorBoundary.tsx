import { Component, ReactNode } from 'react';

// Shows a friendly screen instead of a blank page if a component crashes.
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error('UI crashed:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Something broke on this page</h1>
        <p className="mt-2 text-slate-600">Please reload. If it keeps happening, go back to the home page.</p>
        <a href="/" className="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
          Back to home
        </a>
      </div>
    );
  }
}
