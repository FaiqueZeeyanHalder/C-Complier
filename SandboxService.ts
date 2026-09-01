import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export interface SandboxConfig {
  maxTimeoutMs: number;
  maxOutputBytes: number;
  maxMemoryMb: number;
  allowedCompilerFlags: string[];
}

export interface ISandbox {
  createWorkspace(files: Array<{ name: string; content: string }>): Promise<string>;
  cleanupWorkspace(workspacePath: string): Promise<void>;
  getSanitizedEnv(): NodeJS.ProcessEnv;
  getConfig(): SandboxConfig;
}

export class DevelopmentSandboxService implements ISandbox {
  private config: SandboxConfig = {
    maxTimeoutMs: 20000, // 20 second execution limit for extensive computations/large inputs
    maxOutputBytes: 8 * 1024 * 1024, // 8 MB max stdout/stderr for massive outputs
    maxMemoryMb: 512, // 512 MB virtual memory target for large buffers/arrays
    allowedCompilerFlags: [
      '-O0',
      '-O1',
      '-O2',
      '-O3',
      '-std=c99',
      '-std=c11',
      '-std=c17',
      '-std=c2x',
      '-std=c23',
      '-Wall',
      '-Wextra',
      '-Werror',
      '-pedantic',
      '-lm',
      '-pthread',
      '-I.',
      '-fmax-errors=100',
      '-Wno-unused-variable',
      '-Wno-unused-parameter',
    ],
  };

  private baseTmpDir: string;

  constructor() {
    this.baseTmpDir = path.join(os.tmpdir(), 'codeforge-c-sandboxes');
    if (!fs.existsSync(this.baseTmpDir)) {
      fs.mkdirSync(this.baseTmpDir, { recursive: true, mode: 0o700 });
    }
  }

  public getConfig(): SandboxConfig {
    return { ...this.config };
  }

  public async createWorkspace(
    files: Array<{ name: string; content: string }>,
    targetWorkspacePath?: string
  ): Promise<string> {
    const workspacePath =
      targetWorkspacePath || path.join(this.baseTmpDir, `sandbox_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`);

    await fs.promises.mkdir(workspacePath, { recursive: true, mode: 0o700 });

    for (const file of files) {
      // Prevent path traversal attacks
      const safeName = path.normalize(file.name).replace(/^(\.\.(\/|\\|$))+/, '');
      const filePath = path.join(workspacePath, safeName);
      const fileDir = path.dirname(filePath);

      if (!filePath.startsWith(workspacePath)) {
        throw new Error(`Security Violation: Invalid file path '${file.name}'`);
      }

      await fs.promises.mkdir(fileDir, { recursive: true });
      await fs.promises.writeFile(filePath, file.content, 'utf8');
    }

    return workspacePath;
  }

  public async cleanupWorkspace(workspacePath: string): Promise<void> {
    try {
      if (workspacePath && workspacePath.startsWith(this.baseTmpDir) && fs.existsSync(workspacePath)) {
        await fs.promises.rm(workspacePath, { recursive: true, force: true });
      }
    } catch (err) {
      console.warn(`[SandboxService] Warning: Failed to clean up workspace ${workspacePath}:`, err);
    }
  }

  public getSanitizedEnv(): NodeJS.ProcessEnv {
    // Strip all sensitive environment variables (like API keys, tokens, system secrets)
    const basePaths = ['/usr/local/sbin', '/usr/local/bin', '/usr/sbin', '/usr/bin', '/sbin', '/bin'];
    const currentPaths = (process.env.PATH || '').split(':').filter(Boolean);
    const combinedPath = Array.from(new Set([...currentPaths, ...basePaths])).join(':');

    return {
      PATH: combinedPath,
      LANG: 'C.UTF-8',
      LC_ALL: 'C.UTF-8',
      TMPDIR: '/tmp',
    };
  }
}

/**
 * Docker / Production Container Sandbox stub for future enterprise scaling.
 * Implements the same ISandbox contract.
 */
export class DockerSandboxService implements ISandbox {
  public getConfig(): SandboxConfig {
    return {
      maxTimeoutMs: 5000,
      maxOutputBytes: 1024 * 1024,
      maxMemoryMb: 128,
      allowedCompilerFlags: ['-O2', '-std=c11', '-Wall', '-Wextra', '-lm', '-pthread'],
    };
  }

  public async createWorkspace(files: Array<{ name: string; content: string }>): Promise<string> {
    // Placeholder for future isolated Docker container runner
    const devService = new DevelopmentSandboxService();
    return devService.createWorkspace(files);
  }

  public async cleanupWorkspace(workspacePath: string): Promise<void> {
    const devService = new DevelopmentSandboxService();
    return devService.cleanupWorkspace(workspacePath);
  }

  public getSanitizedEnv(): NodeJS.ProcessEnv {
    return {
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      LANG: 'C.UTF-8',
    };
  }
}
