import React from 'react';
import { Keyboard, X, Command } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
  isDark: boolean;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose, isDark }) => {
  const SHORTCUTS = [
    { key: 'F5 / Ctrl+Shift+Enter', desc: 'Run in Interactive Terminal (Live scanf/printf)' },
    { key: 'Ctrl + Enter', desc: 'Compile and run active C project (Batch Output)' },
    { key: 'Ctrl + S', desc: 'Save current project and file' },
    { key: 'Ctrl + O', desc: 'Open Projects Switcher modal' },
    { key: 'Ctrl + F', desc: 'Find in current Monaco editor file' },
    { key: 'Ctrl + H', desc: 'Find and replace in editor' },
    { key: 'Shift + Alt + F', desc: 'Auto-format active C code' },
    { key: 'F1', desc: 'Monaco Editor Command Palette' },
    { key: 'Ctrl + Space', desc: 'Trigger C autocomplete suggestions' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="shortcuts-modal-container"
        className={`w-full max-w-md rounded-xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-[#18181b] border-[#27272a] text-[#e4e4e7]' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-[#141416] border-[#27272a]' : 'bg-slate-50 border-zinc-200'}`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0076B8]/15 border border-[#0076B8]/40 flex items-center justify-center text-[#38bdf8]">
              <Keyboard className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Keyboard Shortcuts</h3>
              <p className="text-[11px] text-zinc-400">Boost your C programming speed</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-500/15 text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-2 text-xs">
          {SHORTCUTS.map((s, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-lg flex items-center justify-between border ${
                isDark ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <span className="text-zinc-300 font-medium">{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700 font-mono text-[11px] text-[#38bdf8] font-bold shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
