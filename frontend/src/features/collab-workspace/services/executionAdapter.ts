/** Result returned by any code execution adapter. */
export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

const getFileName = (language: string): string => {
  switch (language) {
    case 'javascript': return 'main.js';
    case 'typescript': return 'main.ts';
    case 'python': return 'main.py';
    case 'java': return 'Main.java';
    case 'cpp': return 'main.cpp';
    case 'go': return 'main.go';
    case 'rust': return 'main.rs';
    default: return 'main.txt';
  }
};

const LANGUAGE_ALIAS: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  go: 'go',
  rust: 'rust',
};

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
    return language in LANGUAGE_ALIAS;
  },

  async execute(code: string, language: string): Promise<ExecutionResult> {
    const alias = LANGUAGE_ALIAS[language];

    if (!alias) {
      return {
        stdout: '',
        stderr: `Unsupported language: ${language}`,
        exitCode: 1,
      };
    }

    try {
      const response = await fetch('http://localhost:8080/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: alias,
          version: '*',
          files: [
            {
              name: getFileName(language),
              content: code,
            },
          ],
          stdin: '',
          args: [],
          compile_timeout: 10000,
          run_timeout: 3000,
        }),
      });

      if (!response.ok) {
        return {
          stdout: '',
          stderr: `Execution API error: ${response.status}`,
          exitCode: -1,
        };
      }

      const data = await response.json();

      return {
        stdout: data.run?.stdout ?? '',
        stderr: data.run?.stderr ?? '',
        exitCode: data.run?.code ?? -1,
      };

    } catch (err) {
      return {
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Execution failed',
        exitCode: -1,
      };
    }
  },
};