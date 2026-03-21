"use client";
import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="rounded-lg border border-red-900 bg-red-950/30 p-4 text-sm text-red-400">
            <div className="font-semibold mb-1">Component crashed</div>
            <div className="text-xs text-red-500 font-mono">
              {this.state.error.message}
            </div>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-2 text-xs text-red-300 underline hover:text-red-200"
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
