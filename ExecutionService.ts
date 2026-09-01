import { spawn } from 'child_process';
import path from 'path';
import { ISandbox } from './SandboxService.ts';
import { ExecutionResult, ProblemItem } from '../../shared/types.ts';

export interface ExecuteOptions {
  binaryPath: string;
  workspacePath: string;
  stdin?: string;
  timeoutMs?: number;
}

export class ExecutionService {
  private sandbox: ISandbox;

  constructor(sandbox: ISandbox) {
    this.sandbox = sandbox;
  }

  public async execute(options: ExecuteOptions): Promise<ExecutionResult> {
    const config = this.sandbox.getConfig();
    const timeoutLimit = options.timeoutMs || config.maxTimeoutMs;
    const sanitizedEnv = this.sandbox.getSanitizedEnv();

    const startTime = process.hrtime.bigint();

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let isTimedOut = false;
      let outputTruncated = false;

      const binName = `./${path.basename(options.binaryPath)}`;

      // Execute via stdbuf -o0 -e0 to disable glibc block-buffering on stdout/stderr
      // This ensures printf prompts before scanf/fgets flush immediately to the client
      const child = spawn('stdbuf', ['-o0', '-e0', binName], {
        cwd: options.workspacePath,
        env: sanitizedEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Write stdin data atomically and close stdin stream
      if (options.stdin !== undefined && options.stdin !== null) {
        child.stdin.end(options.stdin, 'utf8');
      } else {
        child.stdin.end();
      }

      child.stdout.on('data', (chunk) => {
        if (stdout.length < config.maxOutputBytes) {
          stdout += chunk.toString();
        } else if (!outputTruncated) {
          outputTruncated = true;
          stdout += `\n[Execution output truncated: exceeded maximum output buffer (${Math.round(config.maxOutputBytes / (1024 * 1024))} MB)]\n`;
        }
      });

      child.stderr.on('data', (chunk) => {
        if (stderr.length < config.maxOutputBytes) {
          stderr += chunk.toString();
        } else if (!outputTruncated) {
          outputTruncated = true;
          stderr += `\n[Error output truncated: exceeded maximum error buffer (${Math.round(config.maxOutputBytes / (1024 * 1024))} MB)]\n`;
        }
      });

      const timer = setTimeout(() => {
        isTimedOut = true;
        try {
          child.kill('SIGKILL');
        } catch {
          // ignore
        }
      }, timeoutLimit);

      child.on('close', (code, signal) => {
        clearTimeout(timer);
        const endTime = process.hrtime.bigint();
        const durationNs = Number(endTime - startTime);
        const executionTimeMs = Math.max(1, Math.round(durationNs / 1_000_000));

        let runtimeError = '';
        const problems: ProblemItem[] = [];

        if (isTimedOut) {
          runtimeError = `Time Limit Exceeded (Terminated after ${timeoutLimit / 1000}s). Check for infinite loops or unbuffered inputs.`;
          problems.push({
            type: 'runtime',
            message: runtimeError,
            raw: runtimeError,
          });
        } else if (signal === 'SIGSEGV') {
          runtimeError = 'Runtime Error: Segmentation Fault (SIGSEGV). Invalid memory access or null pointer dereference.';
          problems.push({
            type: 'runtime',
            message: runtimeError,
            raw: runtimeError,
          });
        } else if (signal === 'SIGFPE') {
          runtimeError = 'Runtime Error: Floating Point Exception (SIGFPE). Division by zero or integer overflow.';
          problems.push({
            type: 'runtime',
            message: runtimeError,
            raw: runtimeError,
          });
        } else if (signal === 'SIGABRT') {
          runtimeError = 'Runtime Error: Aborted (SIGABRT). Assertion failed or abort() called.';
          problems.push({
            type: 'runtime',
            message: runtimeError,
            raw: runtimeError,
          });
        } else if (code !== 0 && code !== null) {
          runtimeError = `Process exited with non-zero exit code: ${code}`;
          problems.push({
            type: 'runtime',
            message: runtimeError,
            raw: runtimeError,
          });
        }

        const success = code === 0 && !signal && !isTimedOut;

        resolve({
          success,
          stdout,
          stderr,
          compileError: '',
          runtimeError,
          executionTime: executionTimeMs,
          exitCode: code,
          signal: signal || null,
          problems,
        });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        const endTime = process.hrtime.bigint();
        const executionTimeMs = Math.max(1, Math.round(Number(endTime - startTime) / 1_000_000));

        resolve({
          success: false,
          stdout: '',
          stderr: err.message,
          compileError: '',
          runtimeError: `Execution Spawn Error: ${err.message}`,
          executionTime: executionTimeMs,
          exitCode: -1,
          problems: [{ type: 'runtime', message: err.message, raw: err.message }],
        });
      });
    });
  }
}
