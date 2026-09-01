import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import type { WebSocket } from 'ws';
import { DevelopmentSandboxService } from './SandboxService.ts';
import { CompilerService, CompilationResult } from './CompilerService.ts';
import { ProblemItem } from '../../shared/types.ts';

export interface InteractiveSession {
  id: string;
  workspacePath: string;
  childProcess: ChildProcess | null;
  emitter: EventEmitter;
  wsClients: Set<WebSocket>;
  buffer: Array<{ type: 'stdout' | 'stderr' | 'system'; data: string }>;
  isFinished: boolean;
  exitCode: number | null;
  signal: string | null;
  state: 'idle' | 'compiling' | 'running' | 'finished' | 'stopped' | 'timeout' | 'error';
  createdAt: number;
  lastActivity: number;
  timeoutTimer: NodeJS.Timeout | null;
  pendingStdin: string[];
}

export interface StartSessionOptions {
  files: Array<{ name: string; content: string }>;
  standard?: 'c11' | 'c17' | 'c23';
  compilerFlags?: string[];
  timeoutMs?: number;
  activeFileName?: string;
  entryFile?: string;
}

export class ExecutionSessionService {
  private sessions: Map<string, InteractiveSession> = new Map();
  private sandboxService: DevelopmentSandboxService;
  private compilerService: CompilerService;

  constructor(sandboxService: DevelopmentSandboxService, compilerService: CompilerService) {
    this.sandboxService = sandboxService;
    this.compilerService = compilerService;

    // Periodically clean up stale sessions (> 15 minutes old)
    setInterval(() => {
      this.cleanupStaleSessions();
    }, 60000);
  }

  private cleanupStaleSessions() {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActivity > 15 * 60 * 1000) {
        this.destroySession(id);
      }
    }
  }

  public getSession(id: string): InteractiveSession | undefined {
    const session = this.sessions.get(id);
    if (session) {
      session.lastActivity = Date.now();
    }
    return session;
  }

  /**
   * Create and immediately compile & run an interactive C process session
   */
  public async createAndStartSession(
    options: StartSessionOptions,
    initialWs?: WebSocket
  ): Promise<InteractiveSession> {
    const sessionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const workspacePath = await this.sandboxService.createWorkspace(options.files);

    const emitter = new EventEmitter();
    emitter.setMaxListeners(100);

    const session: InteractiveSession = {
      id: sessionId,
      workspacePath,
      childProcess: null,
      emitter,
      wsClients: new Set(),
      buffer: [],
      isFinished: false,
      exitCode: null,
      signal: null,
      state: 'compiling',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      timeoutTimer: null,
      pendingStdin: [],
    };

    if (initialWs) {
      session.wsClients.add(initialWs);
      this.wireWebSocket(session, initialWs);
    }

    this.sessions.set(sessionId, session);

    // Send session handshake and compiling status
    this.broadcast(session, { type: 'session', sessionId: session.id, state: session.state });
    this.broadcast(session, { type: 'compiling', sessionId });

    // Compile in background
    this.compileAndLaunch(session, options);

    return session;
  }

  public attachWebSocket(sessionId: string, ws: WebSocket): InteractiveSession | undefined {
    const session = this.getSession(sessionId);
    if (!session) return undefined;

    session.wsClients.add(ws);
    this.wireWebSocket(session, ws);

    // Send connection acknowledgement and replay buffer
    ws.send(JSON.stringify({ type: 'session', sessionId: session.id, state: session.state }));

    for (const chunk of session.buffer) {
      ws.send(JSON.stringify(chunk));
    }

    if (session.isFinished) {
      ws.send(
        JSON.stringify({
          type: 'exit',
          code: session.exitCode ?? 0,
          signal: session.signal,
          state: session.state,
        })
      );
    }

    return session;
  }

  private wireWebSocket(session: InteractiveSession, ws: WebSocket) {
    ws.on('message', (messageData: any) => {
      try {
        const text = typeof messageData === 'string' ? messageData : messageData.toString('utf8');
        const parsed = JSON.parse(text);

        if (parsed.type === 'stdin' && typeof parsed.data === 'string') {
          this.writeStdin(session.id, parsed.data);
        } else if (parsed.type === 'stop' || parsed.type === 'kill') {
          this.stopSession(session.id, parsed.signal || 'SIGINT');
        } else if (parsed.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (err) {
        console.error('[ExecutionSessionService] WS message parse error:', err);
      }
    });

    ws.on('close', () => {
      session.wsClients.delete(ws);
    });
  }

  private async compileAndLaunch(session: InteractiveSession, options: StartSessionOptions) {
    try {
      const compileResult = await this.compilerService.compile(session.workspacePath, {
        standard: options.standard || 'c17',
        customFlags: options.compilerFlags || [],
        activeFileName: options.activeFileName,
        entryFile: options.entryFile,
      });

      if (!compileResult.success || !compileResult.binaryPath) {
        session.isFinished = true;
        session.state = 'error';
        session.exitCode = 1;

        const errorOutput = compileResult.compilerOutput || 'Compilation failed';
        this.appendOutput(session, 'stderr', errorOutput + '\n');
        this.broadcast(session, {
          type: 'compile_error',
          message: errorOutput,
          problems: compileResult.problems,
          command: compileResult.command,
        });
        this.broadcast(session, { type: 'exit', code: 1, signal: null });
        session.emitter.emit('exit', 1);
        return;
      }

      // Successful compilation - Start interactive execution
      session.state = 'running';
      this.broadcast(session, {
        type: 'running',
        command: `./${compileResult.binaryPath.split('/').pop() || 'main'}`,
        compilerCommand: compileResult.command,
      });

      const config = this.sandboxService.getConfig();
      const timeoutLimit = options.timeoutMs || config.maxTimeoutMs || 20000;
      const sanitizedEnv = {
        ...this.sandboxService.getSanitizedEnv(),
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        HOME: session.workspacePath,
        PWD: session.workspacePath,
        PYTHONUNBUFFERED: '1',
      };

      const binName = `./program_bin`;

      // Spawn with stdbuf -i0 -o0 -e0 for unbuffered stdin, stdout, and stderr
      const child = spawn('stdbuf', ['-i0', '-o0', '-e0', binName], {
        cwd: session.workspacePath,
        env: sanitizedEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      session.childProcess = child;

      // Flush any pre-buffered stdin
      if (session.pendingStdin && session.pendingStdin.length > 0) {
        for (const input of session.pendingStdin) {
          try {
            child.stdin?.write(input, 'utf8');
          } catch (err) {
            console.error('[ExecutionSessionService] Error flushing pending stdin:', err);
          }
        }
        session.pendingStdin = [];
      }

      // Set timeout timer
      session.timeoutTimer = setTimeout(() => {
        if (!session.isFinished) {
          session.state = 'timeout';
          this.appendOutput(
            session,
            'system',
            `\n\r\x1b[33m[Time Limit Exceeded (${Math.round(timeoutLimit / 1000)}s) - Execution Terminated]\x1b[0m\r\n`
          );
          this.stopSession(session.id, 'SIGKILL');
        }
      }, timeoutLimit);

      // Handle real-time stdout
      child.stdout?.on('data', (chunk: Buffer) => {
        session.lastActivity = Date.now();
        const text = chunk.toString('utf8');
        this.appendOutput(session, 'stdout', text);
      });

      // Handle real-time stderr
      child.stderr?.on('data', (chunk: Buffer) => {
        session.lastActivity = Date.now();
        const text = chunk.toString('utf8');
        this.appendOutput(session, 'stderr', text);
      });

      child.on('error', (err) => {
        session.lastActivity = Date.now();
        session.isFinished = true;
        session.state = 'error';
        session.exitCode = 1;
        this.appendOutput(session, 'stderr', `\n\r\x1b[31mProcess spawn error: ${err.message}\x1b[0m\r\n`);
        this.broadcast(session, { type: 'error', message: err.message });
        this.broadcast(session, { type: 'exit', code: 1, signal: null });
        session.emitter.emit('exit', 1);
      });

      child.on('close', (code, signal) => {
        session.lastActivity = Date.now();
        if (session.timeoutTimer) {
          clearTimeout(session.timeoutTimer);
          session.timeoutTimer = null;
        }

        session.isFinished = true;
        session.exitCode = code ?? (signal ? 130 : 0);
        session.signal = signal ?? null;

        if (session.state === 'running') {
          session.state = 'finished';
        }

        this.broadcast(session, {
          type: 'exit',
          code: session.exitCode,
          signal: session.signal,
          state: session.state,
        });

        session.emitter.emit('exit', session.exitCode);
      });
    } catch (err: any) {
      session.isFinished = true;
      session.state = 'error';
      session.exitCode = 1;
      this.appendOutput(session, 'stderr', `\n\r\x1b[31mExecution error: ${err.message}\x1b[0m\r\n`);
      this.broadcast(session, { type: 'error', message: err.message });
      this.broadcast(session, { type: 'exit', code: 1, signal: null });
      session.emitter.emit('exit', 1);
    }
  }

  public writeStdin(sessionId: string, data: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.isFinished) {
      return false;
    }

    session.lastActivity = Date.now();

    if (session.childProcess && session.childProcess.stdin && !session.childProcess.killed) {
      try {
        session.childProcess.stdin.write(data, 'utf8');
        return true;
      } catch (err) {
        console.error('[ExecutionSessionService] Failed to write stdin:', err);
        return false;
      }
    } else {
      // Buffer if process is still starting
      if (!session.pendingStdin) {
        session.pendingStdin = [];
      }
      session.pendingStdin.push(data);
      return true;
    }
  }

  public stopSession(sessionId: string, signal: NodeJS.Signals = 'SIGINT'): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (session.timeoutTimer) {
      clearTimeout(session.timeoutTimer);
      session.timeoutTimer = null;
    }

    if (session.state !== 'timeout') {
      session.state = 'stopped';
      this.appendOutput(session, 'system', '\r\n\x1b[33mProcess terminated by user.\x1b[0m\r\n');
    }

    if (session.childProcess && !session.childProcess.killed) {
      try {
        session.childProcess.kill(signal);
      } catch {
        try {
          session.childProcess.kill('SIGKILL');
        } catch {
          // ignore
        }
      }
    }

    session.isFinished = true;
    return true;
  }

  public destroySession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.timeoutTimer) {
      clearTimeout(session.timeoutTimer);
      session.timeoutTimer = null;
    }

    if (session.childProcess && !session.childProcess.killed) {
      try {
        session.childProcess.kill('SIGKILL');
      } catch {
        // ignore
      }
    }

    for (const ws of session.wsClients) {
      try {
        ws.close();
      } catch {
        // ignore
      }
    }

    session.wsClients.clear();
    session.emitter.removeAllListeners();

    this.sandboxService.cleanupWorkspace(session.workspacePath).catch(() => {});
    this.sessions.delete(sessionId);
  }

  private appendOutput(session: InteractiveSession, type: 'stdout' | 'stderr' | 'system', data: string) {
    if (session.buffer.length > 1000) {
      session.buffer.shift();
    }
    session.buffer.push({ type, data });
    this.broadcast(session, { type, data });
    session.emitter.emit('data', { type, data });
  }

  private broadcast(session: InteractiveSession, payload: any) {
    const message = JSON.stringify(payload);
    for (const ws of session.wsClients) {
      if (ws.readyState === 1 /* OPEN */) {
        try {
          ws.send(message);
        } catch {
          // ignore
        }
      }
    }
  }
}
