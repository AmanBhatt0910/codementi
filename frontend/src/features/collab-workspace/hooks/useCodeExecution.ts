'use client';
import { useState, useCallback, useRef } from 'react';
import { pistonAdapter } from '../services/executionAdapter';

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error';

export interface ExecutionState {
  status: ExecutionStatus;
  output: string;
  error: string;
  exitCode: number | null;
}

const INITIAL_STATE: ExecutionState = {
  status: 'idle',
  output: '',
  error: '',
  exitCode: null,
};

/**
 * Manages the lifecycle of a single code execution request.
 * Uses the pistonAdapter by default; the adapter is replaceable.
 */
export function useCodeExecution() {
  const [state, setState] = useState<ExecutionState>(INITIAL_STATE);
  const isRunningRef = useRef(false);

  const run = useCallback(async (code: string, language: string) => {
    if (isRunningRef.current) return;
    if (!code.trim()) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: 'Editor is empty — write some code first.',
        exitCode: -1,
      }));
      return;
    }

    isRunningRef.current = true;
    setState({ status: 'running', output: '', error: '', exitCode: null });

    try {
      const result = await pistonAdapter.execute(code, language);
      setState({
        status: result.exitCode === 0 && !result.stderr ? 'success' : 'error',
        output: result.stdout,
        error: result.stderr,
        exitCode: result.exitCode,
      });
    } catch (err) {
      setState({
        status: 'error',
        output: '',
        error: err instanceof Error ? err.message : 'Unexpected execution error.',
        exitCode: -1,
      });
    } finally {
      isRunningRef.current = false;
    }
  }, []);

  const clear = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { state, run, clear };
}
