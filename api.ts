import { Router, Request, Response } from 'express';
import {
  sandboxService,
  compilerService,
  executionService,
  terminalService,
  aiService,
  sessionService,
} from '../services/instances.ts';
import { LESSONS, CHALLENGES } from '../data/content.ts';
import { CompileRunRequest, ExecutionResult, AIAnalysisRequest } from '../../shared/types.ts';
import { execSync } from 'child_process';

const router = Router();

let cachedGccVersion = '';
try {
  cachedGccVersion = execSync('gcc --version', { timeout: 2000, encoding: 'utf8' }).split('\n')[0] || 'GCC Available';
} catch {
  cachedGccVersion = 'GCC Ready';
}

// 1. Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    compiler: 'gcc',
    gccVersion: cachedGccVersion,
    sandboxMode: 'DevelopmentIsolation',
    limits: sandboxService.getConfig(),
    timestamp: new Date().toISOString(),
  });
});

// 1b. Compiler Environment & Standard Library Info
router.get('/compiler', async (_req: Request, res: Response) => {
  try {
    const envInfo = await compilerService.getCompilerEnvironment();
    res.json(envInfo);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to detect compiler environment: ${err.message}` });
  }
});

// 2. Compile Only
router.post('/compile', async (req: Request, res: Response) => {
  const body: CompileRunRequest = req.body || {};
  const code = body.code || '';
  const files = body.files && body.files.length > 0 ? body.files : [{ name: 'main.c', content: code }];

  if (!code && files.every((f) => !f.content.trim())) {
    res.status(400).json({
      success: false,
      stdout: '',
      stderr: 'Bad Request: No source code provided to compile.',
      compileError: 'No source code provided',
      runtimeError: '',
      executionTime: 0,
      problems: [{ type: 'error', message: 'No source code provided' }],
    });
    return;
  }

  let workspacePath = '';
  try {
    workspacePath = await sandboxService.createWorkspace(files);
    const compileResult = await compilerService.compile(workspacePath, {
      standard: body.standard,
      customFlags: body.compilerOptions || body.compilerFlags || [],
      activeFileName: (body as any).activeFileName || (body as any).activeFile,
      entryFile: (body as any).entryFile,
    });

    res.json({
      success: compileResult.success,
      stdout: '',
      stderr: compileResult.compilerOutput,
      compileError: compileResult.success ? '' : compileResult.compilerOutput,
      runtimeError: '',
      executionTime: 0,
      problems: compileResult.problems,
      compilerCommand: compileResult.command,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      stdout: '',
      stderr: `Server Error: ${err.message}`,
      compileError: err.message,
      runtimeError: '',
      executionTime: 0,
      problems: [{ type: 'error', message: err.message, raw: err.message }],
    });
  } finally {
    if (workspacePath) {
      await sandboxService.cleanupWorkspace(workspacePath);
    }
  }
});

// 3. Compile and Run
router.post('/run', async (req: Request, res: Response) => {
  const body: CompileRunRequest = req.body || {};
  const code = body.code || '';
  const stdin = body.stdin || '';
  const files = body.files && body.files.length > 0 ? body.files : [{ name: 'main.c', content: code }];

  if (!code && files.every((f) => !f.content.trim())) {
    res.status(400).json({
      success: false,
      stdout: '',
      stderr: 'Bad Request: No source code provided.',
      compileError: 'No source code provided',
      runtimeError: '',
      executionTime: 0,
      problems: [{ type: 'error', message: 'No source code provided' }],
    });
    return;
  }

  let workspacePath = '';
  try {
    workspacePath = await sandboxService.createWorkspace(files);
    const compileResult = await compilerService.compile(workspacePath, {
      standard: body.standard,
      customFlags: body.compilerOptions || body.compilerFlags || [],
      activeFileName: (body as any).activeFileName || (body as any).activeFile,
      entryFile: (body as any).entryFile,
    });

    if (!compileResult.success || !compileResult.binaryPath) {
      res.json({
        success: false,
        stdout: '',
        stderr: compileResult.compilerOutput,
        compileError: compileResult.compilerOutput,
        runtimeError: '',
        executionTime: 0,
        problems: compileResult.problems,
        compilerCommand: compileResult.command,
      });
      return;
    }

    const execResult = await executionService.execute({
      binaryPath: compileResult.binaryPath,
      workspacePath,
      stdin,
    });

    const combinedProblems = [...compileResult.problems, ...(execResult.problems || [])];

    const result: ExecutionResult = {
      success: execResult.success,
      stdout: execResult.stdout,
      stderr: execResult.stderr,
      compileError: '',
      runtimeError: execResult.runtimeError,
      executionTime: execResult.executionTime,
      exitCode: execResult.exitCode,
      signal: execResult.signal,
      problems: combinedProblems,
      compilerCommand: compileResult.command,
    };

    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      stdout: '',
      stderr: `Server Error: ${err.message}`,
      compileError: '',
      runtimeError: err.message,
      executionTime: 0,
      problems: [{ type: 'runtime', message: err.message, raw: err.message }],
    });
  } finally {
    if (workspacePath) {
      await sandboxService.cleanupWorkspace(workspacePath);
    }
  }
});

// 4. AI Assistant
router.post('/ai/analyze', async (req: Request, res: Response) => {
  try {
    const analysisReq: AIAnalysisRequest = req.body;
    if (!analysisReq || !analysisReq.action) {
      res.status(400).json({ error: 'Missing action in AI request' });
      return;
    }
    const result = await aiService.analyze(analysisReq);
    res.json(result);
  } catch (err: any) {
    console.error('[AI API Error]:', err);
    res.status(500).json({
      markdown: `**AI Assistant Notice**: ${err.message || 'Failed to process AI request. Make sure GEMINI_API_KEY is configured in Settings > Secrets.'}`,
      error: err.message,
    });
  }
});

// 5. Lessons & Challenges
router.get('/lessons', (_req: Request, res: Response) => {
  res.json(LESSONS);
});

router.get('/challenges', (_req: Request, res: Response) => {
  res.json(CHALLENGES);
});

// 6. Challenge Test Runner
router.post('/challenges/test', async (req: Request, res: Response) => {
  const { challengeId, code } = req.body;
  const challenge = CHALLENGES.find((c) => c.id === challengeId);

  if (!challenge) {
    res.status(404).json({ error: 'Challenge not found' });
    return;
  }

  let workspacePath = '';
  try {
    workspacePath = await sandboxService.createWorkspace([{ name: 'solution.c', content: code }]);
    const compileResult = await compilerService.compile(workspacePath, ['-O2', '-std=c11']);

    if (!compileResult.success || !compileResult.binaryPath) {
      res.json({
        passed: false,
        compileError: compileResult.compilerOutput,
        results: challenge.testCases.map((tc) => ({
          id: tc.id,
          description: tc.description,
          passed: false,
          actual: '',
          expected: tc.expectedOutput,
          error: 'Compilation failed',
        })),
      });
      return;
    }

    const testResults = [];
    let allPassed = true;

    for (const testCase of challenge.testCases) {
      const execResult = await executionService.execute({
        binaryPath: compileResult.binaryPath,
        workspacePath,
        stdin: testCase.input,
        timeoutMs: 3000,
      });

      const actualTrimmed = execResult.stdout.replace(/\r\n/g, '\n').trim();
      const expectedTrimmed = testCase.expectedOutput.replace(/\r\n/g, '\n').trim();
      const passed = execResult.success && actualTrimmed === expectedTrimmed;

      if (!passed) allPassed = false;

      testResults.push({
        id: testCase.id,
        description: testCase.description,
        input: testCase.input,
        passed,
        actual: execResult.stdout,
        expected: testCase.expectedOutput,
        error: execResult.runtimeError || (execResult.stderr ? execResult.stderr : undefined),
        executionTime: execResult.executionTime,
      });
    }

    res.json({
      passed: allPassed,
      results: testResults,
      totalPassed: testResults.filter((r) => r.passed).length,
      totalTests: testResults.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  } finally {
    if (workspacePath) {
      await sandboxService.cleanupWorkspace(workspacePath);
    }
  }
});

// ==========================================
// 8. INTERACTIVE TERMINAL ENDPOINTS
// ==========================================

// Create or initialize an interactive terminal session
router.post('/terminal/session', async (req: Request, res: Response) => {
  const { files = [], command } = req.body;
  try {
    const sessionFiles = files.length > 0 ? files : [{ name: 'main.c', content: '' }];
    const session = await terminalService.createSession(sessionFiles, command);

    res.json({
      sessionId: session.id,
      status: 'created',
      hasRunningProcess: !!session.childProcess,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Execute a command in an existing session (or sync files and execute)
router.post('/terminal/exec', async (req: Request, res: Response) => {
  const { sessionId, command, files } = req.body;

  let session = sessionId ? terminalService.getSession(sessionId) : undefined;

  try {
    if (!session) {
      const sessionFiles = files && files.length > 0 ? files : [{ name: 'main.c', content: '' }];
      session = await terminalService.createSession(sessionFiles);
    } else if (files && files.length > 0) {
      // Sync latest editor files to disk
      await sandboxService.createWorkspace(files, session.workspacePath);
    }

    if (command) {
      terminalService.runCommandInSession(session, command);
    }

    res.json({
      sessionId: session.id,
      status: 'running',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stream real-time stdout / stderr / exit events via Server-Sent Events (SSE)
router.get('/terminal/stream/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = terminalService.getSession(sessionId);

  if (!session) {
    res.status(404).json({ error: 'Session not found or expired' });
    return;
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Flush connection open comment
  res.write(': connected\n\n');

  // Replay existing output buffer if any
  for (const chunk of session.buffer) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }

  if (session.isFinished) {
    res.write(`data: ${JSON.stringify({ type: 'exit', code: session.exitCode })}\n\n`);
  }

  const onData = (payload: { type: string; data: string }) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const onExit = (exitCode: number) => {
    res.write(`data: ${JSON.stringify({ type: 'exit', code: exitCode })}\n\n`);
  };

  session.emitter.on('data', onData);
  session.emitter.on('exit', onExit);

  // Heartbeat ping every 15s to keep connection alive
  const pingInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(pingInterval);
    session.emitter.off('data', onData);
    session.emitter.off('exit', onExit);
  });
});

// Send live input (stdin) into the running process
router.post('/terminal/input', (req: Request, res: Response) => {
  const { sessionId, data } = req.body;
  if (!sessionId || data === undefined) {
    res.status(400).json({ error: 'sessionId and data are required' });
    return;
  }

  const success = terminalService.writeInput(sessionId, data);
  res.json({ success });
});

// Interrupt or kill the process in the terminal session (Ctrl+C / Kill)
router.post('/terminal/kill', (req: Request, res: Response) => {
  const { sessionId, signal = 'SIGINT' } = req.body;
  const session = terminalService.getSession(sessionId);

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const success = terminalService.killSessionProcess(session, signal);
  res.json({ success });
});

// Close and clean up session
router.post('/terminal/close', (req: Request, res: Response) => {
  const { sessionId } = req.body;
  if (sessionId) {
    terminalService.killSession(sessionId);
  }
  res.json({ success: true });
});

// ==========================================
// 8. INTERACTIVE EXECUTION SESSION ENDPOINTS (REST + SSE)
// ==========================================

// Start an interactive session via REST
router.post('/session/start', async (req: Request, res: Response) => {
  const { files = [], code = '', standard = 'c17', compilerFlags = [], timeoutMs, activeFileName, entryFile } = req.body;
  try {
    const sessionFiles = files.length > 0 ? files : [{ name: 'main.c', content: code }];
    const session = await sessionService.createAndStartSession({
      files: sessionFiles,
      standard,
      compilerFlags,
      timeoutMs,
      activeFileName: activeFileName || (req.body as any).activeFile,
      entryFile,
    });

    res.json({
      sessionId: session.id,
      state: session.state,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SSE stream for interactive session
router.get('/session/:sessionId/stream', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = sessionService.getSession(sessionId);

  if (!session) {
    res.status(404).json({ error: 'Session not found or expired' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(': connected\n\n');

  // Replay existing buffer
  for (const chunk of session.buffer) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }

  if (session.isFinished) {
    res.write(
      `data: ${JSON.stringify({
        type: 'exit',
        code: session.exitCode ?? 0,
        signal: session.signal,
        state: session.state,
      })}\n\n`
    );
  }

  const onData = (payload: { type: string; data: string }) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const onExit = (exitCode: number) => {
    res.write(
      `data: ${JSON.stringify({
        type: 'exit',
        code: exitCode,
        signal: session.signal,
        state: session.state,
      })}\n\n`
    );
  };

  session.emitter.on('data', onData);
  session.emitter.on('exit', onExit);

  const pingInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(pingInterval);
    session.emitter.off('data', onData);
    session.emitter.off('exit', onExit);
  });
});

// Send stdin to interactive session
router.post('/session/:sessionId/stdin', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { data } = req.body;
  if (data === undefined) {
    res.status(400).json({ error: 'data is required' });
    return;
  }

  const success = sessionService.writeStdin(sessionId, data);
  res.json({ success });
});

// Stop interactive session
router.post('/session/:sessionId/stop', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { signal = 'SIGINT' } = req.body;
  const success = sessionService.stopSession(sessionId, signal);
  res.json({ success });
});

// Close/destroy session
router.post('/session/:sessionId/destroy', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  sessionService.destroySession(sessionId);
  res.json({ success: true });
});

export default router;
