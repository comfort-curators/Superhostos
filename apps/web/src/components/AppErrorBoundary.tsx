import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, message: '' };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App render error', { error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 p-6 text-stone-900">
          <div className="mx-auto mt-16 max-w-2xl rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-semibold">SuperhostOS encountered a runtime error</h1>
            <p className="mt-3 text-sm text-stone-600">
              The app failed to initialize. Please verify environment variables and browser console logs.
            </p>
            <pre className="mt-4 overflow-auto rounded-2xl bg-stone-100 p-3 text-xs text-rose-700">{this.state.message}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
