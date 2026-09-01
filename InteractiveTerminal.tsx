import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  Square,
  Trash2,
  Copy,
  Check,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Sparkles,
} from 'lucide-react';
import { ProjectFile, ProblemItem } from '../../shared/types.ts';
import { useExecutionSession, ExecutionState } from '../hooks/useExecutionSession.ts';

interface InteractiveTerminalProps {
  files: ProjectFile[];
  activeFile?: ProjectFile;
  isDark: boolean;
  onRunTriggered?: () => void;
  runTrigger?: number;
  cStandard?: string;
  onStateChange?: (state: ExecutionState) => void;
  onProblemsDetected?: (problems: ProblemItem[]) => void;
}

// Convert ANSI escape codes to React elements
function renderAnsiFormatted(text: string) {
  if (!text.includes('\x1b[')) {
    return text;
  }

  const parts = text.split(/(\x1b\[[0-9;]*m)/g);
  let currentClasses = '';
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;
    if (part.startsWith('\x1b[')) {
      const code = part.slice(2, -1);
      if (code === '0' || code === '') {
        currentClasses = '';
      } else if (code === '1') {
        currentClasses += ' font-bold';
      } else if (code === '31' || code === '1;31' || code === '91') {
        currentClasses = ' text-rose-400 font-semibold';
      } else if (code === '32' || code === '1;32' || code === '92') {
        currentClasses = ' text-[#38bdf8] font-semibold';
      } else if (code === '33' || code === '1;33' || code === '93') {
        currentClasses = ' text-amber-300 font-semibold';
      } else if (code === '34' || code === '1;34' || code === '94') {
        currentClasses = ' text-sky-400 font-semibold';
      } else if (code === '35' || code === '1;35') {
        currentClasses = ' text-purple-400 font-semibold';
      } else if (code === '36' || code === '1;36' || code === '96') {
        currentClasses = ' text-cyan-400 font-semibold';
      } else if (code === '37' || code === '97') {
        currentClasses = ' text-zinc-100';
      }
    } else {
      elements.push(
        <span key={i} className={currentClasses || undefined}>
          {part}
        </span>
      );
    }
  }

  return elements.length > 0 ? <>{elements}</> : text;
}

export const InteractiveTerminal: React.FC<InteractiveTerminalProps> = ({
  files,
  activeFile,
  isDark,
  runTrigger,
  cStandard = 'c17',
  onStateChange,
  onProblemsDetected,
}) => {
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const terminalScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastRunTriggerRef = useRef<number | undefined>(runTrigger);

  const {
    state,
    lines,
    exitCode,
    executionTime,
    currentInput,
    setCurrentInput,
    startExecution,
    sendStdin,
    stopProcess,
    clearTerminal,
    isRunning,
  } = useExecutionSession({
    cStandard,
    activeFileName: activeFile?.name,
    onStateChange,
    onProblemsDetected,
  });

  // Auto-scroll on lines or input changes
  useEffect(() => {
    if (terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [lines, currentInput, isRunning, state]);

  // Keep input focused when clicking on the terminal or when execution starts
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, [state, isRunning]);

  // Run the C program
  const handleRunProgram = useCallback(() => {
    startExecution(files, { standard: cStandard, activeFileName: activeFile?.name });
  }, [files, cStandard, activeFile, startExecution]);

  // Watch run trigger from props (e.g. from top Run button / F5 / Ctrl+Enter)
  useEffect(() => {
    if (runTrigger && runTrigger !== lastRunTriggerRef.current) {
      lastRunTriggerRef.current = runTrigger;
      handleRunProgram();
    }
  }, [runTrigger, handleRunProgram]);

  // Submit input either via Enter key or Send button
  const handleInputSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isRunning) {
      // Send stdin to the running C program
      const val = currentInput;
      sendStdin(val);
      if (val.trim()) {
        setHistory((prev) => [val, ...prev.filter((h) => h !== val)]);
        setHistoryIndex(-1);
      }
      setCurrentInput('');
    } else {
      // In idle state, if user types 'run' or presses Enter, run the code
      const trimmed = currentInput.trim();
      if (trimmed === 'clear' || trimmed === 'cls') {
        clearTerminal();
        setCurrentInput('');
      } else {
        setCurrentInput('');
        handleRunProgram();
      }
    }
  };

  // Handle keyboard events in input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputSubmit();
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      if (isRunning) {
        stopProcess();
      } else {
        setCurrentInput('');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      clearTerminal();
    } else if (e.key === 'ArrowUp' && !isRunning) {
      e.preventDefault();
      if (history.length > 0) {
        const nextIndex = historyIndex + 1 < history.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIndex);
        setCurrentInput(history[nextIndex] || '');
      }
    } else if (e.key === 'ArrowDown' && !isRunning) {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setCurrentInput(history[nextIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    }
  };

  const handleCopyTerminal = () => {
    const text = lines
      .map((l) => {
        if (l.type === 'prompt') return `$ ${l.text}`;
        if (l.type === 'input') return `> ${l.text}`;
        return l.text;
      })
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Status Badge formatting
  const renderStatusBadge = () => {
    if (state === 'compiling') {
      return (
        <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 text-[10px] animate-pulse">
          <div className="w-2 h-2 border border-amber-400 border-t-transparent rounded-full animate-spin" />
          Compiling GCC...
        </span>
      );
    }
    if (state === 'running') {
      return (
        <span className="flex items-center gap-1 text-[#38bdf8] bg-[#0076B8]/15 px-2 py-0.5 rounded-full border border-[#0076B8]/40 text-[10px] animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
          Running (Interactive I/O)
        </span>
      );
    }
    if (state === 'finished') {
      return (
        <span className="flex items-center gap-1 text-[#38bdf8] bg-[#0076B8]/10 px-2 py-0.5 rounded-full border border-[#0076B8]/30 text-[10px]">
          <CheckCircle2 className="w-3 h-3 text-[#38bdf8]" />
          Finished (Exit 0)
        </span>
      );
    }
    if (state === 'stopped') {
      return (
        <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 text-[10px]">
          <Square className="w-2.5 h-2.5 fill-current" />
          Terminated by User
        </span>
      );
    }
    if (state === 'timeout') {
      return (
        <span className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30 text-[10px]">
          <Clock className="w-3 h-3" />
          Time Limit Exceeded (20s)
        </span>
      );
    }
    if (state === 'error') {
      return (
        <span className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30 text-[10px]">
          <XCircle className="w-3 h-3" />
          Execution Error
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[#64748b] text-[10px]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]" />
        Ready
      </span>
    );
  };

  return (
    <div
      id="interactive-terminal-container"
      className="h-full flex flex-col font-mono text-xs select-text bg-[#080c13]"
      onClick={handleTerminalClick}
    >
      {/* 1. Terminal Action Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0b0f17] border-b border-[#1e293b] text-[11px] font-sans select-none shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center gap-1.5 text-white font-medium">
            <TerminalIcon className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Interactive Terminal</span>
          </div>

          <span className="text-[#334155]">•</span>

          {renderStatusBadge()}

          {executionTime !== null && (
            <span className="text-[#94a3b8] font-mono text-[10px] hidden sm:inline">
              {executionTime}ms
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-1.5">
          {/* Run Button */}
          <button
            type="button"
            id="terminal-btn-run"
            onClick={(e) => {
              e.stopPropagation();
              handleRunProgram();
            }}
            disabled={isRunning}
            className="px-2.5 py-1 bg-[#0076B8] hover:bg-[#0088d4] disabled:opacity-50 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            title="Compile and Run in Terminal (F5 / Ctrl+Enter)"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run</span>
          </button>

          {/* Stop Button */}
          {isRunning && (
            <button
              type="button"
              id="terminal-btn-stop"
              onClick={(e) => {
                e.stopPropagation();
                stopProcess();
              }}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Stop running process (Ctrl+C)"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          )}

          {/* Quick Copy */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyTerminal();
            }}
            className="p-1 text-[#94a3b8] hover:text-white hover:bg-[#1e293b] rounded transition-colors cursor-pointer"
            title="Copy Terminal Output"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#38bdf8]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearTerminal();
            }}
            className="p-1 text-[#94a3b8] hover:text-rose-400 hover:bg-[#1e293b] rounded transition-colors cursor-pointer"
            title="Clear Terminal (Ctrl+L)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Terminal Body */}
      <div
        ref={terminalScrollRef}
        id="terminal-scroll-viewport"
        className="flex-1 p-3.5 overflow-y-auto font-mono text-xs leading-relaxed space-y-0.5 bg-[#080c13]"
      >
        {lines.map((line) => {
          if (line.type === 'prompt') {
            return (
              <div key={line.id} className="flex items-start text-white pt-1">
                <span className="text-[#38bdf8] font-semibold select-none mr-2 whitespace-nowrap">
                  $
                </span>
                <span className="text-[#e2e8f0] break-all">{line.text}</span>
              </div>
            );
          }

          if (line.type === 'input') {
            return (
              <div key={line.id} className="text-[#38bdf8] font-semibold break-all flex items-center gap-1.5">
                <span className="text-[#0076B8] select-none">&gt;</span>
                <span>{line.text}</span>
              </div>
            );
          }

          if (line.type === 'stderr') {
            return (
              <div key={line.id} className="text-rose-400 whitespace-pre-wrap break-all">
                {renderAnsiFormatted(line.text)}
              </div>
            );
          }

          if (line.type === 'system') {
            return (
              <div key={line.id} className="text-[#64748b] italic whitespace-pre-wrap break-all">
                {renderAnsiFormatted(line.text)}
              </div>
            );
          }

          // Default stdout
          return (
            <div key={line.id} className="text-[#cbd5e1] whitespace-pre-wrap break-all">
              {renderAnsiFormatted(line.text)}
            </div>
          );
        })}

        {/* 3. Active Interactive Line with Blinking Cursor & Direct Typing */}
        <form onSubmit={handleInputSubmit} className="flex items-center text-white pt-1.5 gap-2">
          {isRunning ? (
            <div className="flex items-center text-[#38bdf8] select-none shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping mr-1.5 inline-block" />
              <span className="text-[#38bdf8] font-bold">&gt;</span>
            </div>
          ) : (
            <span className="text-[#38bdf8] font-semibold select-none whitespace-nowrap">
              $
            </span>
          )}

          <div className="relative flex-1 flex items-center">
            <input
              ref={inputRef}
              id="terminal-interactive-input"
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isRunning
                  ? 'Type input for scanf() / fgets() / getchar() and press Enter...'
                  : 'Type run or press Enter to compile & execute...'
              }
              autoFocus
              className="w-full bg-transparent text-white font-mono text-xs outline-none border-none p-0 focus:ring-0 placeholder:text-[#475569]"
            />
            {/* Blinking block cursor when empty and running */}
            {isRunning && !currentInput && (
              <span className="text-[#38bdf8] font-mono animate-pulse select-none pointer-events-none">
                █
              </span>
            )}
          </div>

          {/* Explicit Enter / Send button */}
          <button
            type="submit"
            id="terminal-btn-send-stdin"
            disabled={!isRunning && !currentInput.trim()}
            className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              isRunning
                ? 'bg-[#0076B8] hover:bg-[#0088d4] active:bg-[#005f94] text-white shadow-xs'
                : currentInput.trim()
                ? 'bg-[#1e293b] hover:bg-[#334155] text-white border border-[#334155]'
                : 'opacity-0 pointer-events-none'
            }`}
            title="Send input to C program (Enter)"
          >
            <span>Enter</span>
            <Send className="w-2.5 h-2.5" />
          </button>
        </form>
      </div>

      {/* 4. Interactive Stdin Quick Action Bar */}
      {isRunning && (
        <div className="px-3 py-2 bg-[#0b0f17] border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans shrink-0">
          <div className="flex items-center gap-1.5 text-[#94a3b8]">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
            <span className="text-white font-semibold">Live Interactive Input:</span>
            <span>Type response & press <kbd className="px-1.5 py-0.5 bg-[#1e293b] border border-[#334155] rounded text-[#38bdf8] font-mono text-[10px]">Enter</kbd></span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#64748b] text-[10px] font-mono">Quick Stdin:</span>
            {['25', '10 20', '42', 'Alice'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sendStdin(val);
                }}
                className="px-2 py-0.5 rounded bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-[#cbd5e1] hover:text-white font-mono text-[10px] transition-colors cursor-pointer"
              >
                {val}
              </button>
            ))}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                stopProcess();
              }}
              className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[10px] font-semibold cursor-pointer ml-1"
            >
              Stop (Ctrl+C)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
