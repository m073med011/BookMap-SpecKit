"use client";

import type { ComponentType, ReactNode } from "react";
import React, { Component } from "react";
import { ErrorFallback } from "@/components/shared/app-shell/ErrorFallback";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  onReset?: () => void;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { children, fallback } = this.props;
    const { error } = this.state;

    if (error) {
      return fallback ?? <ErrorFallback error={error} reset={this.reset} />;
    }

    return children;
  }
}

export function withErrorBoundary<TProps extends object>(
  WrappedComponent: ComponentType<TProps>,
  fallback?: ReactNode,
) {
  return function WithErrorBoundary(props: TProps) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
