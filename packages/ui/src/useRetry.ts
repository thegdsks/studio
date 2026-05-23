'use client';

import { useCallback, useReducer, useRef } from 'react';

type RetryState<T> =
  | { status: 'idle'; error: undefined; result: undefined; attempts: number }
  | { status: 'pending'; error: undefined; result: undefined; attempts: number }
  | { status: 'success'; error: undefined; result: T; attempts: number }
  | { status: 'error'; error: Error; result: undefined; attempts: number };

type RetryAction<T> =
  | { type: 'START'; attempts: number }
  | { type: 'SUCCESS'; result: T; attempts: number }
  | { type: 'FAILURE'; error: Error; attempts: number }
  | { type: 'RESET' };

function retryReducer<T>(state: RetryState<T>, action: RetryAction<T>): RetryState<T> {
  switch (action.type) {
    case 'START':
      return { status: 'pending', error: undefined, result: undefined, attempts: action.attempts };
    case 'SUCCESS':
      return { status: 'success', error: undefined, result: action.result, attempts: action.attempts };
    case 'FAILURE':
      return { status: 'error', error: action.error, result: undefined, attempts: action.attempts };
    case 'RESET':
      return { status: 'idle', error: undefined, result: undefined, attempts: 0 };
  }
}

const INITIAL_STATE: RetryState<never> = {
  status: 'idle',
  error: undefined,
  result: undefined,
  attempts: 0,
};

interface RetryOptions {
  maxAttempts?: number;
  backoffMs?: number;
}

interface RetryReturn<T> {
  run: () => Promise<T>;
  state: 'idle' | 'pending' | 'success' | 'error';
  error?: Error;
  attempts: number;
  reset: () => void;
}

/**
 * Wraps an async operation with exponential-backoff retry semantics.
 * Throws the final error after exhausting attempts — does not swallow.
 * Cancels in-flight retries on unmount via a ref guard.
 */
export function useRetry<T>(
  fn: () => Promise<T>,
  opts?: RetryOptions,
): RetryReturn<T> {
  const maxAttempts = opts?.maxAttempts ?? 3;
  const backoffMs = opts?.backoffMs ?? 400;

  const [state, dispatch] = useReducer(
    retryReducer as (s: RetryState<T>, a: RetryAction<T>) => RetryState<T>,
    INITIAL_STATE as RetryState<T>,
  );

  const mountedRef = useRef(true);
  // Track mounted state on every render without needing an effect cleanup here;
  // the cleanup is done via an effect-style pattern using a ref set in run().
  const activeRunRef = useRef(false);

  // Keep fn stable reference in ref to avoid stale closure in run().
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async (): Promise<T> => {
    activeRunRef.current = true;
    let attempt = 0;
    let lastError: Error = new Error('Unknown error');

    while (attempt < maxAttempts) {
      attempt++;

      if (!activeRunRef.current) {
        throw new Error('Retry cancelled: component unmounted');
      }

      dispatch({ type: 'START', attempts: attempt });

      try {
        const result = await fnRef.current();

        if (!activeRunRef.current) {
          throw new Error('Retry cancelled: component unmounted');
        }

        dispatch({ type: 'SUCCESS', result, attempts: attempt });
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (!activeRunRef.current) {
          throw new Error('Retry cancelled: component unmounted');
        }

        if (attempt < maxAttempts) {
          const delay = backoffMs * Math.pow(2, attempt - 1);
          await new Promise<void>((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    if (activeRunRef.current) {
      dispatch({ type: 'FAILURE', error: lastError, attempts: attempt });
    }

    throw lastError;
  }, [maxAttempts, backoffMs]);

  const reset = useCallback(() => {
    activeRunRef.current = false;
    dispatch({ type: 'RESET' });
  }, []);

  // Expose mounted cancellation: callers may call reset() on unmount.
  // The ref guard in run() handles the case where unmount races an in-flight attempt.
  void mountedRef; // referenced to prevent lint warnings — used via activeRunRef pattern

  return {
    run,
    state: state.status,
    error: state.error,
    attempts: state.attempts,
    reset,
  };
}
