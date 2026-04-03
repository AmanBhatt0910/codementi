'use client';
import { Terminal, CheckCircle2, XCircle, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import type { ExecutionStatus } from '../hooks/useCodeExecution';

interface OutputConsoleProps {
  status: ExecutionStatus;
  output: string;
  error: string;
  exitCode: number | null;
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
}

/**
 * Collapsible output console panel rendered below the code editor.
 * Shows stdout, stderr, and exit code for the most recent execution.
 */
export function OutputConsole({
  status,
  output,
  error,
  exitCode,
  isOpen,
  onToggle,
  onClear,
}: OutputConsoleProps) {
  const hasContent = !!(output || error);

  return (
    <div className="flex flex-col h-full bg-[#0a0f1a] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/6 shrink-0 min-h-[36px]">
        <Terminal size={12} className="text-brand-400 shrink-0" />
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Output</span>

        {/* Status indicator */}
        {status === 'running' && (
          <Loader2 size={11} className="ml-1 animate-spin text-brand-400" aria-label="Running" />
        )}
        {status === 'success' && (
          <CheckCircle2 size={11} className="ml-1 text-emerald-400" aria-label="Success" />
        )}
        {status === 'error' && (
          <XCircle size={11} className="ml-1 text-red-400" aria-label="Error" />
        )}

        {exitCode !== null && (
          <span className={clsx(
            'ml-1 text-xs px-1.5 py-0.5 rounded font-mono',
            exitCode === 0 ? 'text-emerald-400/70 bg-emerald-500/10' : 'text-red-400/70 bg-red-500/10'
          )}>
            exit {exitCode}
          </span>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {hasContent && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear output"
              className="p-1 rounded-md text-white/30 hover:text-white/70 hover:bg-white/6 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400"
            >
              <X size={11} />
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-label={isOpen ? 'Collapse output panel' : 'Expand output panel'}
            aria-expanded={isOpen}
            className="p-1 rounded-md text-white/30 hover:text-white/70 hover:bg-white/6 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400"
          >
            {isOpen ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
          </button>
        </div>
      </div>

      {/* Content area (hidden when collapsed) */}
      {isOpen && (
        <div
          role="log"
          aria-live="polite"
          aria-label="Execution output"
          className="flex-1 min-h-0 overflow-y-auto p-3 font-mono text-xs leading-relaxed"
        >
          {status === 'idle' && !hasContent && (
            <p className="text-white/20 select-none">Run your code to see output here.</p>
          )}

          {status === 'running' && (
            <p className="text-white/40 animate-pulse">Executing…</p>
          )}

          {output && (
            <pre className="text-emerald-300/90 whitespace-pre-wrap break-words">{output}</pre>
          )}

          {error && (
            <pre className={clsx(
              'whitespace-pre-wrap break-words',
              output ? 'mt-2 text-red-400/90' : 'text-red-400/90'
            )}>
              {error}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
