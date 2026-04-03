/** Result returned by any code execution adapter. */
export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/** Contract that any execution backend must implement. */
export interface ExecutionAdapter {
  execute(code: string, language: string): Promise<ExecutionResult>;
  supportsLanguage(language: string): boolean;
}

/** Piston runtime descriptor. */
interface PistonRuntime {
  language: string;
  version: string;
}

const PISTON_RUNTIMES: Readonly<Record<string, PistonRuntime>> = {
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3' },
  python:     { language: 'python',     version: '3.10.0'  },
  java:       { language: 'java',       version: '15.0.2'  },
  cpp:        { language: 'c++',        version: '10.2.0'  },
  go:         { language: 'go',         version: '1.16.2'  },
  rust:       { language: 'rust',       version: '1.50.0'  },
};

interface PistonRunOutput {
  stdout?: string;
  stderr?: string;
  code?: number;
}

interface PistonResponse {
  run?: PistonRunOutput;
}

/**
 * Execution adapter backed by the Piston API (https://piston.readthedocs.io).
 * This is the default adapter; swap it out by implementing ExecutionAdapter
 * and passing it to `createExecutionService`.
 */
export const pistonAdapter: ExecutionAdapter = {
  supportsLanguage(language: string): boolean {
    return language in PISTON_RUNTIMES;
  },

  async execute(code: string, language: string): Promise<ExecutionResult> {
    const runtime = PISTON_RUNTIMES[language];
    if (!runtime) {
      return {
        stdout: '',
        stderr: `Language "${language}" is not supported for execution. Supported: ${Object.keys(PISTON_RUNTIMES).join(', ')}.`,
        exitCode: 1,
      };
    }

    let response: Response;
    try {
      response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: runtime.language,
          version: runtime.version,
          files: [{ name: 'main', content: code }],
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      return { stdout: '', stderr: `Execution service unreachable: ${message}`, exitCode: -1 };
    }

    if (!response.ok) {
      return {
        stdout: '',
        stderr: `Execution API responded with status ${response.status}.`,
        exitCode: -1,
      };
    }

    const data: PistonResponse = await response.json();
    const run = data.run ?? {};
    return {
      stdout: run.stdout ?? '',
      stderr: run.stderr ?? '',
      exitCode: run.code ?? 0,
    };
  },
};
