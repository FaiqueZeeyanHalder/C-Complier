import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { DevelopmentSandboxService } from './SandboxService.ts';

export interface TerminalSession {
  id: string;
  workspacePath: string;
  childProcess: ChildProcess | null;
  emitter: EventEmitter;
  buffer: Array<{ type: 'stdout' | 'stderr' | 'system'; data: string }>;
  isFinished: boolean;
  exitCode: number | null;
  createdAt: number;
  lastActivity: number;
  timeoutTimer: NodeJS.Timeout | null;
}

export class TerminalService {
  private sessions: Map<string, TerminalSession> = new Map();
  private sandboxService: DevelopmentSandboxService;

  constructor(sandboxService: DevelopmentSandboxService) {
    this.sandboxService = sandboxService;

    // Periodically clean up stale sessions (> 15 minutes old)
    setInterval(() => {
      this.cleanupStaleSessions();
    }, 60000);
  }

  private cleanupStaleSessions() {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActivity > 15 * 60 * 1000) {
        this.killSession(id);
      }
    }
  }

  public async createSession(
    files: Array<{ name: string; content: string }>,
    commandToRun?: string
  ): Promise<TerminalSession> {
    const sessionId = `term_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const workspacePath = await this.sandboxService.createWorkspace(files);

    const emitter = new EventEmitter();
    emitter.setMaxListeners(50);

    const session: TerminalSession = {
      id: sessionId,
      workspacePath,
      childProcess: null,
      emitter,
      buffer: [],
      isFinished: false,
      exitCode: null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      timeoutTimer: null,
    };

    this.sessions.set(sessionId, session);

    if (commandToRun) {
      this.runCommandInSession(session, commandToRun);
    }

    return session;
  }

  public getSession(id: string): TerminalSession | undefined {
    const session = this.sessions.get(id);
    if (session) {
      session.lastActivity = Date.now();
    }
    return session;
  }

  public runCommandInSession(session: TerminalSession, command: string) {
    session.lastActivity = Date.now();

    // Kill any currently running process in this session
    if (session.childProcess && !session.childProcess.killed) {
      try {
        session.childProcess.kill('SIGKILL');
      } catch {
        // ignore
      }
    }

    session.isFinished = false;
    session.exitCode = null;

    const sanitizedEnv = {
      PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US.UTF-8',
      HOME: session.workspacePath,
      PWD: session.workspacePath,
      PYTHONUNBUFFERED: '1',
    };

    // Execute via bash with unbuffered stdio wrappers (-i0 unbuffered stdin, -o0 unbuffered stdout, -e0 unbuffered stderr)
    const child = spawn(
      'bash',
      ['-c', `stdbuf -i0 -o0 -e0 ${command}`],
      {
        cwd: session.workspacePath,
        env: sanitizedEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    session.childProcess = child;

    // Timeout after 2 minutes for interactive sessions
    if (session.timeoutTimer) clearTimeout(session.timeoutTimer);
    session.timeoutTimer = setTimeout(() => {
      if (!session.isFinished) {
        this.appendOutput(session, 'system', '\r\n\x1b[33m[Execution timed out after 2 minutes]\x1b[0m\r\n');
        this.killSessionProcess(session);
      }
    }, 120000);

    child.stdout?.on('data', (chunk: Buffer) => {
      session.lastActivity = Date.now();
      const text = chunk.toString('utf8');
      this.appendOutput(session, 'stdout', text);
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      session.lastActivity = Date.now();
      const text = chunk.toString('utf8');
      this.appendOutput(session, 'stderr', text);
    });

    child.on('error', (err) => {
      session.lastActivity = Date.now();
      this.appendOutput(session, 'stderr', `\r\n\x1b[31mProcess error: ${err.message}\x1b[0m\r\n`);
      session.isFinished = true;
      session.exitCode = 1;
      session.emitter.emit('exit', 1);
    });

    child.on('close', (code) => {
      session.lastActivity = Date.now();
      if (session.timeoutTimer) {
        clearTimeout(session.timeoutTimer);
        session.timeoutTimer = null;
      }
      session.isFinished = true;
      session.exitCode = code ?? 0;
      session.emitter.emit('exit', code ?? 0);
    });
  }

  public writeInput(sessionId: string, data: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.childProcess || session.isFinished) {
      return false;
    }

    session.lastActivity = Date.now();
    try {
      session.childProcess.stdin?.write(data, 'utf8');
      return true;
    } catch {
      return false;
    }
  }

  public killSessionProcess(session: TerminalSession, signal: NodeJS.Signals = 'SIGINT'): boolean {
    if (!session.childProcess || session.isFinished) return false;
    try {
      session.childProcess.kill(signal);
      return true;
    } catch {
      return false;
    }
  }

  public killSession(sessionId: string) {
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

    session.emitter.removeAllListeners();
    this.sandboxService.cleanupWorkspace(session.workspacePath).catch(() => {});
    this.sessions.delete(sessionId);
  }

  private appendOutput(session: TerminalSession, type: 'stdout' | 'stderr' | 'system', data: string) {
    // Keep max 500 chunks in history buffer
    if (session.buffer.length > 500) {
      session.buffer.shift();
    }
    session.buffer.push({ type, data });
    session.emitter.emit('data', { type, data });
  }
}
