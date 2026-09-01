import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, X, ArrowRight, CornerDownLeft, Sparkles, Zap, MessageSquareQuote } from 'lucide-react';

interface InputPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRun: (stdinValue: string) => void;
  onRunInTerminal: () => void;
  initialStdin: string;
  detectedFunctions: string[];
  isDark: boolean;
}

export const InputPromptModal: React.FC<InputPromptModalProps> = ({
  isOpen,
  onClose,
  onRun,
  onRunInTerminal,
  initialStdin,
  detectedFunctions,
  isDark,
}) => {
  const [inputValue, setInputValue] = useState(initialStdin);
  const [showBatchInput, setShowBatchInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialStdin);
      setShowBatchInput(false);
    }
  }, [isOpen, initialStdin]);

  if (!isOpen) return null;

  const handlePreset = (val: string) => {
    setInputValue(val);
    setShowBatchInput(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onRun(inputValue);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div
        className={`w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden flex flex-col ${
          isDark ? 'bg-[#0b0f17] border-[#1e293b] text-[#cbd5e1]' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className={`px-4 py-3.5 border-b flex items-center justify-between ${
          isDark ? 'border-[#1e293b] bg-[#090d14]' : 'border-zinc-200 bg-slate-50'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0076B8]/20 border border-[#0076B8]/40 flex items-center justify-center text-[#38bdf8]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                Standard Input Detected (I/O)
              </h3>
              <p className="text-[10px] text-[#94a3b8]">
                Functions in code: <span className="text-[#38bdf8] font-mono font-medium">{detectedFunctions.join(', ') || 'scanf / fgets'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-[#94a3b8] hover:text-white hover:bg-[#1e293b] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5 font-sans">
          {/* Real-time Interactive Terminal Card (Recommended Option) */}
          <div
            onClick={() => {
              onClose();
              onRunInTerminal();
            }}
            className="p-3.5 rounded-lg border border-[#0076B8]/40 bg-[#0076B8]/10 hover:bg-[#0076B8]/20 hover:border-[#0076B8] transition-all cursor-pointer group flex items-start gap-3 shadow-xs"
          >
            <div className="w-8 h-8 rounded-md bg-[#0076B8] text-white flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform shadow-xs">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Run in Interactive Terminal (Real-time I/O)</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#0076B8] text-white text-[9px] font-bold uppercase tracking-wider">
                    Recommended
                  </span>
                </h4>
                <ArrowRight className="w-4 h-4 text-[#38bdf8] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-1 leading-relaxed">
                Prints <code className="text-[#38bdf8] font-mono font-semibold">printf(...)</code> prompts in real-time first, then lets you type your numbers/strings directly into <code className="text-[#38bdf8] font-mono font-semibold">scanf(...)</code> as they appear.
              </p>
            </div>
          </div>

          {/* Toggle for Batch Pre-filled input mode */}
          <div className="pt-1">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowBatchInput(!showBatchInput)}
                className="text-[11px] font-medium text-[#94a3b8] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{showBatchInput ? '▾ Hide' : '▸ Or provide pre-filled batch input'}</span>
              </button>
            </div>

            {showBatchInput && (
              <div className="mt-2.5 space-y-2.5 animate-in fade-in duration-150">
                {/* Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-[#64748b] font-mono mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => handlePreset('10 20')}
                    className="px-2 py-0.5 rounded bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-[#cbd5e1] hover:text-white transition-colors font-mono cursor-pointer"
                  >
                    10 20
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreset('42')}
                    className="px-2 py-0.5 rounded bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-[#cbd5e1] hover:text-white transition-colors font-mono cursor-pointer"
                  >
                    42
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreset('Hello World')}
                    className="px-2 py-0.5 rounded bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-[#cbd5e1] hover:text-white transition-colors font-mono cursor-pointer"
                  >
                    "Hello World"
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreset('5\n10 20 30 40 50')}
                    className="px-2 py-0.5 rounded bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-[#cbd5e1] hover:text-white transition-colors font-mono cursor-pointer"
                  >
                    Array (5 items)
                  </button>
                </div>

                {/* Text Area */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. 15 25&#10;or multiple lines for sequential scanf/fgets..."
                    rows={3}
                    className={`w-full p-2.5 rounded border font-mono text-xs outline-none resize-y ${
                      isDark
                        ? 'bg-[#010409] border-[#1e293b] text-white focus:border-[#0076B8]'
                        : 'bg-white border-zinc-300 text-zinc-900 focus:border-[#0076B8]'
                    }`}
                  />
                  <div className="text-[10px] text-[#64748b] flex justify-between mt-1 font-mono">
                    <span>{inputValue.length} chars • {inputValue ? inputValue.split('\n').length : 0} lines</span>
                    <span>Press Ctrl+Enter to Run Batch</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-4 py-3 border-t flex items-center justify-between ${
          isDark ? 'border-[#1e293b] bg-[#090d14]' : 'border-zinc-200 bg-slate-50'
        }`}>
          <button
            type="button"
            onClick={() => {
              onClose();
              onRunInTerminal();
            }}
            className="px-3.5 py-1.5 rounded bg-[#0076B8] hover:bg-[#0088d4] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Open & Run in Terminal</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs text-[#94a3b8] hover:text-white hover:bg-[#1e293b] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {showBatchInput && (
              <button
                type="button"
                onClick={() => onRun(inputValue)}
                className="px-3 py-1.5 rounded bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-[#cbd5e1] hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Run Batch</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
