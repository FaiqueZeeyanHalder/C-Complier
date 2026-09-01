import { useState, useRef, useCallback, useEffect } from 'react';
import { ProjectFile, ProblemItem } from '../../shared/types.ts';

export type ExecutionState =
  | 'idle'
  | 'compiling'
  | 'running'
  | 'waitingForInput'
  | 'finished'
  | 'stopped'
  | 'timeout'
  | 'error';

export interface TerminalLine {
  id: string;
  type: 'prompt' | 'stdout' | 'stderr' | 'system' | 'input';
  text: string;
  command?: string;
  timestamp?: number;
}

export interface UseExecutionSessionOptions {
  cStandard?: string;
  compilerFlags?: string[];
  timeoutMs?: number;
  activeFileName?: string;
  onStateChange?: (state: ExecutionState) => void;
  onProblemsDetected?: (problems: ProblemItem[]) => void;
}

export function useExecutionSession(options: UseExecutionSessionOptions = {}) {
  const [state, setState] = useState<ExecutionState>('idle');
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      type: 'system',
      text: 'CodeForge Integrated Terminal [Linux x86_64 GCC Sandbox]',
    },
    {
      id: 'init-2',
      type: 'system',
      text: 'Real-time interactive I/O: Output streams instantly, stdin is piped live to running scanf() / getchar() / fgets() calls.',
    },
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [signal, setSignal] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [activeCommand, setActiveCommand] = useState<string>('');
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const startTimeRef = useRef<number>(0);
  const activeSessionIdRef = useRef<string | null>(null);

  // Keep ref in sync
  activeSessionIdRef.current = sessionId;

  const updateState = useCallback(
    (newState: ExecutionState) => {
      setState(newState);
      options.onStateChange?.(newState);
    },
    [options]
  );

  // Clean up connections
  const cleanupConnections = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close();
      } catch {
        // ignore
      }
      eventSourceRef.current = null;
    }
  }, []);

  // Stop / Terminate Running Process
  const stopProcess = useCallback(async () => {
    const currentId = activeSessionIdRef.current;
    if (!currentId) return;

    // Send stop through WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop', signal: 'SIGINT' }));
    } else {
      // Fallback to REST stop endpoint
      fetch(`/api/session/${currentId}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal: 'SIGINT' }),
      }).catch(() => {});
    }

    updateState('stopped');
  }, [updateState]);

  // Send stdin to the running C process
  const sendStdin = useCallback(
    async (text: string) => {
      // Append typed input directly into the terminal stream
      const formattedInput = text.endsWith('\n') ? text : text + '\n';
      setLines((prev) => [
        ...prev,
        {
          id: `line-${Date.now()}-stdin`,
          type: 'input',
          text: text,
        },
      ]);
      setCurrentInput('');

      // Send via WebSocket if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'stdin', data: formattedInput }));
        return;
      }

      // Fallback to REST stdin endpoint if available
      const currentId = activeSessionIdRef.current;
      if (currentId) {
        try {
          await fetch(`/api/session/${currentId}/stdin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: formattedInput }),
          });
        } catch (err) {
          console.error('Failed to send stdin to session:', err);
        }
      }
    },
    []
  );

  // Clear Terminal Output
  const clearTerminal = useCallback(() => {
    setLines([]);
    setCurrentInput('');
  }, []);

  // Start Real Interactive Execution
  const startExecution = useCallback(
    async (
      files: ProjectFile[],
      customOptions?: { standard?: string; compilerFlags?: string[]; activeFileName?: string; entryFile?: string }
    ) => {
      cleanupConnections();

      const filesPayload = files.map((f) => ({ name: f.name, content: f.content }));
      const standard = customOptions?.standard || options.cStandard || 'c17';
      const compilerFlags = customOptions?.compilerFlags || options.compilerFlags || [];
      const activeFileName = customOptions?.activeFileName || options.activeFileName || (files[0]?.name ?? 'main.c');
      const stdFlag = standard ? `-std=${standard}` : '-std=c17';
      const mainCmd = `./${activeFileName.replace(/\.c$/, '') || 'main'}`;

      startTimeRef.current = Date.now();
      setExitCode(null);
      setSignal(null);
      setExecutionTime(null);
      setProblems([]);
      setCurrentInput('');
      setActiveCommand(mainCmd);
      updateState('compiling');

      // Append startup lines to terminal
      setLines((prev) => [
        ...prev,
        {
          id: `line-${Date.now()}-cmd`,
          type: 'prompt',
          text: `gcc ${stdFlag} ${activeFileName} -Wall -Wextra -O2 -lm -o main && ./main`,
          command: mainCmd,
        },
        {
          id: `line-${Date.now()}-compiling`,
          type: 'system',
          text: `[Compiling with GCC ${standard.toUpperCase()}...]`,
        },
      ]);

      // Connect via WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;

      let wsConnected = false;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          wsConnected = true;
          ws.send(
            JSON.stringify({
              type: 'start',
              files: filesPayload,
              standard,
              compilerFlags,
              timeoutMs: options.timeoutMs || 20000,
              activeFileName,
              entryFile: customOptions?.entryFile,
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);

            if (payload.sessionId) {
              setSessionId(payload.sessionId);
              activeSessionIdRef.current = payload.sessionId;
            }

            if (payload.type === 'session') {
              setSessionId(payload.sessionId);
              activeSessionIdRef.current = payload.sessionId;
            } else if (payload.type === 'compiling') {
              updateState('compiling');
            } else if (payload.type === 'running') {
              updateState('running');
            } else if (payload.type === 'stdout') {
              setLines((prev) => [
                ...prev,
                {
                  id: `line-${Date.now()}-${Math.random()}`,
                  type: 'stdout',
                  text: payload.data,
                },
              ]);
            } else if (payload.type === 'stderr') {
              setLines((prev) => [
                ...prev,
                {
                  id: `line-${Date.now()}-${Math.random()}`,
                  type: 'stderr',
                  text: payload.data,
                },
              ]);
            } else if (payload.type === 'system') {
              setLines((prev) => [
                ...prev,
                {
                  id: `line-${Date.now()}-${Math.random()}`,
                  type: 'system',
                  text: payload.data,
                },
              ]);
            } else if (payload.type === 'compile_error') {
              updateState('error');
              if (payload.problems) {
                setProblems(payload.problems);
                options.onProblemsDetected?.(payload.problems);
              }
            } else if (payload.type === 'exit') {
              const duration = Date.now() - startTimeRef.current;
              setExecutionTime(duration);
              setExitCode(payload.code);
              setSignal(payload.signal || null);

              if (payload.state === 'stopped') {
                updateState('stopped');
              } else if (payload.state === 'timeout') {
                updateState('timeout');
              } else if (payload.code === 0 && !payload.signal) {
                updateState('finished');
              } else {
                updateState('error');
              }

              setLines((prev) => [
                ...prev,
                {
                  id: `line-${Date.now()}-exit`,
                  type: 'system',
                  text: `\nProcess finished with exit code ${payload.code ?? 0}`,
                },
              ]);

              cleanupConnections();
            } else if (payload.type === 'error') {
              updateState('error');
              setLines((prev) => [
                ...prev,
                {
                  id: `line-${Date.now()}-err`,
                  type: 'stderr',
                  text: `\nExecution Error: ${payload.message}\n`,
                },
              ]);
              cleanupConnections();
            }
          } catch {
            // ignore non-json
          }
        };

        ws.onerror = () => {
          // If WebSocket fails to connect, fallback to REST + SSE
          if (!wsConnected) {
            connectViaSSE(filesPayload, standard, compilerFlags, activeFileName, customOptions?.entryFile);
          }
        };

        ws.onclose = () => {
          if (state === 'running' || state === 'compiling') {
            // Check if exited cleanly
          }
        };
      } catch {
        // Fallback to REST + SSE
        connectViaSSE(filesPayload, standard, compilerFlags, activeFileName, customOptions?.entryFile);
      }
    },
    [options, cleanupConnections, state, updateState]
  );

  // Fallback SSE + REST connection
  const connectViaSSE = async (
    files: Array<{ name: string; content: string }>,
    standard: string,
    compilerFlags: string[],
    activeFileName?: string,
    entryFile?: string
  ) => {
    try {
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          standard,
          compilerFlags,
          timeoutMs: options.timeoutMs || 20000,
          activeFileName,
          entryFile,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to start execution session (${res.statusText})`);
      }

      const data = await res.json();
      const currentSessionId = data.sessionId;
      setSessionId(currentSessionId);
      activeSessionIdRef.current = currentSessionId;

      const sse = new EventSource(`/api/session/${currentSessionId}/stream`);
      eventSourceRef.current = sse;

      sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'stdout') {
            updateState('running');
            setLines((prev) => [
              ...prev,
              {
                id: `line-${Date.now()}-${Math.random()}`,
                type: 'stdout',
                text: payload.data,
              },
            ]);
          } else if (payload.type === 'stderr') {
            setLines((prev) => [
              ...prev,
              {
                id: `line-${Date.now()}-${Math.random()}`,
                type: 'stderr',
                text: payload.data,
              },
            ]);
          } else if (payload.type === 'system') {
            setLines((prev) => [
              ...prev,
              {
                id: `line-${Date.now()}-${Math.random()}`,
                type: 'system',
                text: payload.data,
              },
            ]);
          } else if (payload.type === 'exit') {
            const duration = Date.now() - startTimeRef.current;
            setExecutionTime(duration);
            setExitCode(payload.code);
            setSignal(payload.signal || null);

            if (payload.state === 'stopped') {
              updateState('stopped');
            } else if (payload.state === 'timeout') {
              updateState('timeout');
            } else if (payload.code === 0 && !payload.signal) {
              updateState('finished');
            } else {
              updateState('error');
            }

            setLines((prev) => [
              ...prev,
              {
                id: `line-${Date.now()}-exit`,
                type: 'system',
                text: `\nProcess finished with exit code ${payload.code ?? 0}`,
              },
            ]);

            sse.close();
          }
        } catch {
          // ignore
        }
      };

      sse.onerror = () => {
        sse.close();
      };
    } catch (err: any) {
      updateState('error');
      setLines((prev) => [
        ...prev,
        {
          id: `line-${Date.now()}-err`,
          type: 'stderr',
          text: `\nConnection Error: ${err.message}\n`,
        },
      ]);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupConnections();
      if (activeSessionIdRef.current) {
        fetch(`/api/session/${activeSessionIdRef.current}/destroy`, { method: 'POST' }).catch(() => {});
      }
    };
  }, [cleanupConnections]);

  return {
    state,
    lines,
    sessionId,
    exitCode,
    signal,
    executionTime,
    activeCommand,
    problems,
    currentInput,
    setCurrentInput,
    startExecution,
    sendStdin,
    stopProcess,
    clearTerminal,
    isRunning: state === 'compiling' || state === 'running',
  };
}
