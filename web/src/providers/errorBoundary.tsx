//
import { Component, ReactNode, ErrorInfo } from 'react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(err: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log the error so you can see it in the console
    console.error("ErrorBoundary caught an error:", error, info);
    // Do NOT reset state here; let the UI show the fallback or null
  }

  render() {
    // If an error occurred, render nothing (or a fallback UI)
    // rendering this.props.children again would just crash the app again
    return this.state.hasError ? null : this.props.children;
  }
}

export default ErrorBoundary;
