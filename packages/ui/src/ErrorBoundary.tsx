'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw, Copy } from 'lucide-react';
import { Card, CardBody } from './Card.js';
import { Button } from './Button.js';
import { requireProp } from './failLoud.js';

// ---------------------------------------------------------------------------
// Internal structured logger — the ONE allowed console call site in this pkg.
// Uses console.error so it surfaces in production monitoring tools.
// ---------------------------------------------------------------------------
interface LogPayload {
  name: string;
  message: string;
  stack?: string;
  componentStack?: string;
  label?: string;
}

function log(payload: LogPayload): void {
  // eslint-disable-next-line no-console
  console.error('[ErrorBoundary]', JSON.stringify(payload, null, 2));
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

const INITIAL_STATE: ErrorBoundaryState = {
  hasError: false,
  error: null,
  componentStack: null,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ErrorBoundaryProps {
  children: ReactNode;
  /** Called when the user clicks Retry — use to reset upstream state. */
  onReset?: () => void;
  /**
   * Human-readable label for the boundary (e.g. "AgentCard", "RunPage").
   * Included in the error log for context.
   */
  label?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Throw loudly if children is missing — no silent fallback.
    requireProp(props.children, 'ErrorBoundary children');
    this.state = INITIAL_STATE;
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const payload: LogPayload = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack ?? undefined,
      label: this.props.label,
    };
    log(payload);
    this.setState({ componentStack: info.componentStack ?? null });
  }

  private handleRetry = (): void => {
    this.props.onReset?.();
    this.setState(INITIAL_STATE);
  };

  private handleCopy = (): void => {
    const { error, componentStack } = this.state;
    if (!error) return;
    const details: LogPayload = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: componentStack ?? undefined,
      label: this.props.label,
    };
    void navigator.clipboard.writeText(JSON.stringify(details, null, 2));
  };

  override render(): ReactNode {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }

    const { error } = this.state;

    return (
      <div className="flex items-start justify-center p-6" role="alert" aria-live="assertive">
        <Card surface="lifted" tone="error" className="w-full max-w-lg">
          <CardBody>
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <AlertTriangle
                  className="text-status-error shrink-0"
                  size={20}
                  aria-hidden="true"
                />
                <span className="font-mono text-mono-md text-status-error font-medium">
                  {this.props.label ? `[${this.props.label}] ` : ''}
                  {error.name}
                </span>
              </div>

              {/* Message */}
              <p className="font-mono text-mono-sm text-text-muted break-words">
                {error.message}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={<RotateCcw size={14} />}
                  onClick={this.handleRetry}
                >
                  Retry
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<Copy size={14} />}
                  onClick={this.handleCopy}
                >
                  Copy details
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }
}
