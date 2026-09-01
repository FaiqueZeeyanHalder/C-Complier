import React from 'react';
import { Settings, X, Moon, Sun, Type, Sliders, Check } from 'lucide-react';
import { EditorSettings } from '../../shared/types.ts';

interface SettingsModalProps {
  settings: EditorSettings;
  onUpdateSettings: (s: Partial<EditorSettings>) => void;
  onClose: () => void;
  isDark: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  isDark,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="settings-modal-container"
        className={`w-full max-w-lg rounded-xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-[#18181b] border-[#27272a] text-[#e4e4e7]' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-[#141416] border-[#27272a]' : 'bg-slate-50 border-zinc-200'}`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0076B8]/15 border border-[#0076B8]/40 flex items-center justify-center text-[#38bdf8]">
              <Settings className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Editor & Environment Settings</h3>
              <p className="text-[11px] text-zinc-400">Customize Monaco editor and compiler behavior</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-500/15 text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold block">Theme</span>
              <span className="text-[11px] text-zinc-400">Dark (VS Dark) or Light (VS Light)</span>
            </div>
            <div className="flex items-center space-x-1 p-1 bg-zinc-500/10 rounded-lg">
              <button
                onClick={() => onUpdateSettings({ theme: 'vs-dark' })}
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 cursor-pointer ${
                  settings.theme === 'vs-dark' ? 'bg-[#0076B8] text-white font-medium' : 'text-zinc-400'
                }`}
              >
                <Moon className="w-3 h-3" /> Dark
              </button>
              <button
                onClick={() => onUpdateSettings({ theme: 'vs-light' })}
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 cursor-pointer ${
                  settings.theme === 'vs-light' ? 'bg-[#0076B8] text-white font-medium' : 'text-zinc-400'
                }`}
              >
                <Sun className="w-3 h-3" /> Light
              </button>
            </div>
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between pt-2 border-t border-current/10">
            <div>
              <span className="font-semibold block">Font Size</span>
              <span className="text-[11px] text-zinc-400">Monaco editor code size</span>
            </div>
            <select
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
              className={`px-3 py-1.5 rounded border text-xs outline-none ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-300'
              }`}
            >
              <option value={12}>12 px</option>
              <option value={13}>13 px</option>
              <option value={14}>14 px (Default)</option>
              <option value={16}>16 px</option>
              <option value={18}>18 px</option>
              <option value={20}>20 px</option>
            </select>
          </div>

          {/* Tab Size */}
          <div className="flex items-center justify-between pt-2 border-t border-current/10">
            <div>
              <span className="font-semibold block">Tab Size</span>
              <span className="text-[11px] text-zinc-400">Indentation width (2 or 4 spaces)</span>
            </div>
            <select
              value={settings.tabSize}
              onChange={(e) => onUpdateSettings({ tabSize: Number(e.target.value) })}
              className={`px-3 py-1.5 rounded border text-xs outline-none ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-300'
              }`}
            >
              <option value={2}>2 Spaces</option>
              <option value={4}>4 Spaces (Standard C)</option>
              <option value={8}>8 Spaces (Linux Kernel)</option>
            </select>
          </div>

          {/* Word Wrap */}
          <div className="flex items-center justify-between pt-2 border-t border-current/10">
            <div>
              <span className="font-semibold block">Word Wrap</span>
              <span className="text-[11px] text-zinc-400">Soft wrap long code lines</span>
            </div>
            <input
              type="checkbox"
              checked={settings.wordWrap === 'on'}
              onChange={(e) => onUpdateSettings({ wordWrap: e.target.checked ? 'on' : 'off' })}
              className="w-4 h-4 accent-[#0076B8] rounded cursor-pointer"
            />
          </div>

          {/* Minimap */}
          <div className="flex items-center justify-between pt-2 border-t border-current/10">
            <div>
              <span className="font-semibold block">Code Minimap</span>
              <span className="text-[11px] text-zinc-400">Show overview scrollbar map</span>
            </div>
            <input
              type="checkbox"
              checked={settings.minimap}
              onChange={(e) => onUpdateSettings({ minimap: e.target.checked })}
              className="w-4 h-4 accent-[#0076B8] rounded cursor-pointer"
            />
          </div>

          {/* Auto Save Delay */}
          <div className="flex items-center justify-between pt-2 border-t border-current/10">
            <div>
              <span className="font-semibold block">Auto-Save Delay</span>
              <span className="text-[11px] text-zinc-400">Persist changes automatically</span>
            </div>
            <select
              value={settings.autoSaveDelay}
              onChange={(e) => onUpdateSettings({ autoSaveDelay: Number(e.target.value) })}
              className={`px-3 py-1.5 rounded border text-xs outline-none ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-300'
              }`}
            >
              <option value={1000}>1 Second</option>
              <option value={2000}>2 Seconds (Default)</option>
              <option value={5000}>5 Seconds</option>
            </select>
          </div>

          {/* C Standard Dialect */}
          <div className="flex items-center justify-between pt-2 border-t border-current/10">
            <div>
              <span className="font-semibold block">C Language Standard</span>
              <span className="text-[11px] text-zinc-400">GCC dialect: ISO C17 (Recommended default), C11, or C23</span>
            </div>
            <select
              value={settings.cStandard || 'c17'}
              onChange={(e) => onUpdateSettings({ cStandard: e.target.value as 'c11' | 'c17' | 'c23' })}
              className={`px-3 py-1.5 rounded border text-xs font-mono outline-none ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-[#38bdf8] font-semibold' : 'bg-zinc-100 border-zinc-300 text-[#0076B8] font-semibold'
              }`}
            >
              <option value="c17">ISO C17 (-std=c17) [Default]</option>
              <option value="c11">ISO C11 (-std=c11)</option>
              <option value="c23">ISO C23 (-std=c23 / -std=c2x)</option>
            </select>
          </div>
        </div>

        <div className={`p-4 border-t flex justify-end ${isDark ? 'bg-[#141416] border-[#27272a]' : 'bg-slate-50 border-zinc-200'}`}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0076B8] hover:bg-[#0088d4] text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
