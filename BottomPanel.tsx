import React, { useState } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  AlertTriangle,
  FileText,
  Copy,
  Trash2,
  Maximize2,
  Minimize2,
  Clock,
  CheckCircle2,
  XCircle,
  Cpu,
  ChevronRight,
  CornerDownLeft,
  Info,
  Check,
  Zap,
} from 'lucide-react';
import { ExecutionResult, ProblemItem, ProjectFile } from '../../shared/types.ts';
import { InteractiveTerminal } from './InteractiveTerminal.tsx';

interface BottomPanelProps {
  activeTab: 'terminal' | 'output' | 'input' | 'problems';
  onSelectTab: (tab: 'terminal' | 'output' | 'input' | 'problems') => void;
  stdin: string;
  onStdinChange: (val: string) => void;
  executionResult: ExecutionResult | null;
  isRunning: boolean;
  onClearOutput: () => void;
  onJumpToProblem: (problem: ProblemItem) => void;
  isDark: boolean;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onRun?: () => void;
  onStop?: () => void;
  detectedInput?: { hasInput: boolean; functions: string[] };
  files?: ProjectFile[];
  activeFile?: ProjectFile;
  terminalRunTrigger?: number;
  cStandard?: string;
  onStateChange?: (state: string) => void;
  onProblemsDetected?: (problems: ProblemItem[]) => void;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  activeTab,
  onSelectTab,
  stdin,
  onStdinChange,
  executionResult,
  isRunning,
  onClearOutput,
  onJumpToProblem,
  isDark,
  isMaximized,
  onToggleMaximize,
  onRun,
  onStop,
  detectedInput,
  files = [],
  activeFile,
  terminalRunTrigger,
  cStandard,
  onStateChange,
  onProblemsDetected,
}) => {
  const [copied, setCopied] = useState(false);
  const [inlineInput, setInlineInput] = useState(stdin);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStdinChange(inlineInput);
    if (onRun) {
      setTimeout(() => onRun(), 10);
    }
  };

  const handlePreset = (val: string) => {
    onStdinChange(val);
    setInlineInput(val);
  };

  const problemsCount = executionResult?.problems?.length || 0;
  const errorCount = executionResult?.problems?.filter((p) => p.type === 'error' || p.type === 'runtime').length || 0;
  const warningCount = executionResult?.problems?.filter((p) => p.type === 'warning').length || 0;

  return (
    <div
      id="bottom-panel"
      className={`border-t flex flex-col select-none transition-all duration-200 z-30 ${
        isMaximized ? 'h-[75vh]' : 'h-64'
      } ${
        isDark ? 'bg-[#090d14] border-[#1e293b] text-[#cbd5e1]' : 'bg-[#f8fafc] border-[#e2e8f0] text-[#334155]'
      }`}
    >
      {/* Top Tab Bar & Actions */}
      <div
        className={`h-9 border-b flex items-center justify-between px-3 text-[11px] shrink-0 ${
          isDark ? 'bg-[#0b0f17] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
        }`}
      >
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 h-full font-medium">
          {/* Terminal Tab - Primary Interactive Environment */}
          <button
            id="tab-btn-terminal"
            onClick={() => onSelectTab('terminal')}
            className={`h-full px-3 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer font-sans ${
              activeTab === 'terminal'
                ? isDark
                  ? 'border-[#0076B8] text-white bg-[#0f172a]/60'
                  : 'border-[#0076B8] text-[#0076B8] bg-white'
                : 'border-transparent text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/40'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Interactive Terminal</span>
            {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping" />}
          </button>

          {/* Output Tab */}
          <button
            id="tab-btn-output"
            onClick={() => onSelectTab('output')}
            className={`h-full px-3 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer font-sans ${
              activeTab === 'output'
                ? isDark
                  ? 'border-[#0076B8] text-white bg-[#0f172a]/60'
                  : 'border-[#0076B8] text-[#0076B8] bg-white'
                : 'border-transparent text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/40'
            }`}
          >
            <span>Batch Output</span>
            {executionResult && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                  executionResult.success ? 'bg-[#0076B8]/20 text-[#38bdf8]' : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {executionResult.executionTime}ms
              </span>
            )}
          </button>

          {/* Input Tab */}
          <button
            id="tab-btn-input"
            onClick={() => onSelectTab('input')}
            className={`h-full px-3 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer font-sans ${
              activeTab === 'input'
                ? isDark
                  ? 'border-[#0076B8] text-white bg-[#0f172a]/60'
                  : 'border-[#0076B8] text-[#0076B8] bg-white'
                : 'border-transparent text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/40'
            }`}
          >
            <span>Preloaded Stdin</span>
            {stdin.trim() && <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />}
          </button>

          {/* Problems Tab */}
          <button
            id="tab-btn-problems"
            onClick={() => onSelectTab('problems')}
            className={`h-full px-3 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer font-sans ${
              activeTab === 'problems'
                ? isDark
                  ? 'border-[#0076B8] text-white bg-[#0f172a]/60'
                  : 'border-[#0076B8] text-[#0076B8] bg-white'
                : 'border-transparent text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/40'
            }`}
          >
            <span>Problems</span>
            {problemsCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  errorCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {problemsCount}
              </span>
            )}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1">
          {activeTab === 'output' && executionResult?.stdout && (
            <button
              onClick={() => handleCopy(executionResult.stdout)}
              className="px-2 py-1 rounded hover:bg-[#1e293b] text-[#94a3b8] hover:text-white transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
              title="Copy Output to Clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#38bdf8]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          <button
            onClick={onClearOutput}
            className="p-1.5 rounded hover:bg-[#1e293b] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
            title="Clear Console Output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleMaximize}
            className="p-1.5 rounded hover:bg-[#1e293b] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
            title={isMaximized ? 'Restore Panel Height' : 'Maximize Panel'}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-xs select-text bg-[#080c13]">
        {/* 1. INPUT TAB */}
        {activeTab === 'input' && (
          <div className="h-full flex flex-col space-y-2.5">
            <div className="text-[11px] text-[#94a3b8] flex flex-wrap items-center justify-between font-sans gap-2">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white">Standard Input (stdin):</span>
                <span>Values automatically piped to <code className="text-[#38bdf8] font-mono">scanf()</code>, <code className="text-[#38bdf8] font-mono">fgets()</code>, and <code className="text-[#38bdf8] font-mono">getchar()</code></span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-[#64748b]">
                <span>{stdin.length} chars • {stdin ? stdin.split('\n').length : 0} lines</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-sans">
              <span className="text-[#64748b] text-[10px] font-mono">Presets:</span>
              <button
                type="button"
                onClick={() => handlePreset('10 20')}
                className="px-2 py-0.5 rounded bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-[#cbd5e1] hover:text-white transition-colors font-mono text-[10px] cursor-pointer"
              >
                10 20 (Two Ints)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('42')}
                className="px-2 py-0.5 rounded bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-[#cbd5e1] hover:text-white transition-colors font-mono text-[10px] cursor-pointer"
              >
                42 (Single Int)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('Alex 28 99.5')}
                className="px-2 py-0.5 rounded bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-[#cbd5e1] hover:text-white transition-colors font-mono text-[10px] cursor-pointer"
              >
                "Alex" 28 99.5
              </button>
              <button
                type="button"
                onClick={() => handlePreset('5\n12 45 3 89 24')}
                className="px-2 py-0.5 rounded bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-[#cbd5e1] hover:text-white transition-colors font-mono text-[10px] cursor-pointer"
              >
                Array: N + Elements
              </button>
              {stdin.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onStdinChange('');
                    setInlineInput('');
                  }}
                  className="px-2 py-0.5 rounded bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 text-rose-300 transition-colors font-mono text-[10px] cursor-pointer ml-auto"
                >
                  Clear Stdin
                </button>
              )}
            </div>

            {/* Multi-line Stdin Editor */}
            <div className="flex-1 relative">
              <textarea
                id="stdin-editor-textarea"
                value={stdin}
                onChange={(e) => {
                  onStdinChange(e.target.value);
                  setInlineInput(e.target.value);
                }}
                placeholder="Enter input values here line by line, or space-separated..."
                className="w-full h-full p-3 rounded-lg bg-[#0b0f17] border border-[#1e293b] focus:border-[#0076B8]/80 focus:ring-1 focus:ring-[#0076B8]/40 outline-none text-[#cbd5e1] placeholder-[#475569] font-mono text-xs resize-none leading-relaxed"
              />
            </div>

            {/* One-click Run with Input */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#64748b] font-sans">
                💡 Tip: Provide test cases here, then click Run to pipe them automatically into standard input.
              </span>
              {onRun && (
                <button
                  type="button"
                  onClick={() => onRun()}
                  disabled={isRunning}
                  className="px-3.5 py-1.5 rounded-md bg-[#0076B8] hover:bg-[#0088d4] active:bg-[#005f94] text-white font-sans text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run Program</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. OUTPUT TAB */}
        {activeTab === 'output' && (
          <div className="h-full flex flex-col">
            {isRunning ? (
              <div className="h-full flex flex-col items-center justify-center space-y-2.5 text-[#94a3b8] font-sans">
                <div className="w-6 h-6 border-2 border-[#0076B8] border-t-transparent rounded-full animate-spin" />
                <p className="font-medium text-xs text-white">Compiling with GCC and running executable...</p>
                <span className="text-[11px] text-[#64748b] font-mono">gcc -Wall -Wextra -O2 -lm</span>
              </div>
            ) : executionResult ? (
              <div className="space-y-3 flex-1 flex flex-col">
                {/* Meta telemetry bar */}
                <div className="flex flex-wrap items-center gap-3 text-xs bg-[#0b0f17] p-2.5 rounded-lg border border-[#1e293b]">
                  <div className="flex items-center gap-1.5 font-sans">
                    <span className="text-[#64748b]">Status:</span>
                    {executionResult.success ? (
                      <span className="text-[#38bdf8] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#38bdf8]" /> Finished (0)
                      </span>
                    ) : (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Exited with Error
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[#94a3b8] font-mono text-[11px]">
                    <Clock className="w-3 h-3 text-[#64748b]" />
                    <span>{executionResult.executionTime}ms</span>
                  </div>

                  {executionResult.exitCode !== undefined && (
                    <div className="flex items-center gap-1 text-[#94a3b8] font-mono text-[11px]">
                      <span>Exit Code: <strong className={executionResult.exitCode === 0 ? 'text-[#38bdf8]' : 'text-rose-400'}>{executionResult.exitCode}</strong></span>
                    </div>
                  )}

                  {stdin.trim() && (
                    <div className="flex items-center gap-1 text-[#38bdf8] font-mono text-[11px] bg-[#0076B8]/15 px-2 py-0.5 rounded border border-[#0076B8]/35">
                      <span>stdin: <strong>"{stdin.length > 25 ? stdin.slice(0, 25) + '...' : stdin}"</strong></span>
                    </div>
                  )}

                  <div className="ml-auto hidden sm:flex items-center gap-1 text-[10px] font-mono text-[#64748b]">
                    <span>gcc 11.4 • x86_64</span>
                  </div>
                </div>

                {/* Stdout display */}
                {executionResult.stdout ? (
                  <div className="flex-1 p-3.5 rounded-lg bg-[#0b0f17] border border-[#1e293b] overflow-auto whitespace-pre-wrap text-[#38bdf8] leading-relaxed font-mono selection:bg-[#0076B8]/30">
                    {executionResult.stdout}
                  </div>
                ) : !executionResult.compileError && !executionResult.runtimeError ? (
                  <div className="p-4 text-[#64748b] italic font-sans">
                    Program executed successfully with no standard output.
                  </div>
                ) : null}

                {/* Compile Error / Stderr / Runtime Error display */}
                {(executionResult.compileError || executionResult.runtimeError || (executionResult.stderr && !executionResult.success)) && (
                  <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    <div className="font-semibold text-rose-400 mb-1.5 flex items-center gap-1.5 font-sans text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" /> Diagnostic Details:
                    </div>
                    {executionResult.compileError || executionResult.runtimeError || executionResult.stderr}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#64748b] font-sans">
                <Play className="w-7 h-7 mb-2 opacity-40 text-[#64748b]" />
                <p className="text-xs">Run your C program to see standard output and execution telemetry.</p>
                <span className="text-[11px] text-[#475569] mt-1 font-mono">Press Ctrl+Enter or click Run</span>
              </div>
            )}
          </div>
        )}

        {/* 3. PROBLEMS TAB */}
        {activeTab === 'problems' && (
          <div className="h-full space-y-2">
            {problemsCount === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#64748b] font-sans">
                <CheckCircle2 className="w-7 h-7 mb-2 text-[#38bdf8]/70" />
                <p className="text-xs">No compilation errors or warnings detected.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {executionResult?.problems?.map((prob, idx) => (
                  <div
                    key={idx}
                    onClick={() => onJumpToProblem(prob)}
                    className={`p-2.5 rounded-lg border flex items-start justify-between cursor-pointer transition-colors ${
                      prob.type === 'error' || prob.type === 'runtime'
                        ? 'bg-rose-950/20 border-rose-900/40 hover:bg-rose-950/30 text-rose-200'
                        : 'bg-amber-950/20 border-amber-900/40 hover:bg-amber-950/30 text-amber-200'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <AlertTriangle
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          prob.type === 'error' || prob.type === 'runtime' ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-xs leading-snug">{prob.message}</div>
                        <div className="text-[10px] text-[#94a3b8] font-mono mt-1 flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded bg-[#0f172a] border border-[#1e293b] text-white">
                            {prob.file || 'main.c'}{prob.line ? `:${prob.line}` : ''}{prob.column ? `:${prob.column}` : ''}
                          </span>
                          <span className="text-[#64748b]">Click to jump to line in editor</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-[#0f172a] text-[#94a3b8] text-[10px] font-mono uppercase tracking-wider shrink-0 ml-2">
                      {prob.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. TERMINAL TAB */}
        {activeTab === 'terminal' && (
          <div className="h-full">
            <InteractiveTerminal
              files={files}
              activeFile={activeFile}
              isDark={isDark}
              onRunTriggered={onRun}
              runTrigger={terminalRunTrigger}
              cStandard={cStandard}
              onStateChange={onStateChange as any}
              onProblemsDetected={onProblemsDetected}
            />
          </div>
        )}
      </div>
    </div>
  );
};
