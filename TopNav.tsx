import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  Save,
  Share2,
  Settings,
  User,
  FolderOpen,
  BookOpen,
  Trophy,
  Moon,
  Sun,
  Code2,
  Check,
  ChevronDown,
  FileCode,
  Download,
  Upload,
  Layers,
  Copy,
  Terminal as TerminalIcon,
  Cpu,
  HelpCircle,
  Sparkles,
  Command,
  LayoutTemplate,
  PanelBottom,
  Sidebar as SidebarIcon,
} from 'lucide-react';
import { CProject, EditorSettings } from '../../shared/types.ts';
import { Logo } from './Logo.tsx';

interface TopNavProps {
  project: CProject;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  isRunning: boolean;
  onRun: () => void;
  onStop?: () => void;
  onRunInTerminal?: () => void;
  onCompileOnly: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onDownloadC: () => void;
  onExportProject: () => void;
  onImportProject: (file: File) => void;
  onOpenProjectsModal: () => void;
  onOpenLearnModal: () => void;
  onOpenChallengesModal: () => void;
  onOpenLibrariesModal: () => void;
  onOpenShareModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenProfileModal: () => void;
  onOpenShortcutsModal: () => void;
  settings: EditorSettings;
  onUpdateSettings: (s: Partial<EditorSettings>) => void;
  onToggleLeftSidebar: () => void;
  onToggleBottomPanel: () => void;
  isLeftSidebarOpen: boolean;
  isBottomPanelOpen: boolean;
  stdin?: string;
  onOpenStdin?: () => void;
  onOpenTerminal?: () => void;
  detectedInput?: { hasInput: boolean; functions: string[] };
}

export const TopNav: React.FC<TopNavProps> = ({
  project,
  saveStatus,
  isRunning,
  onRun,
  onStop,
  onRunInTerminal,
  onCompileOnly,
  onSave,
  onSaveAs,
  onDownloadC,
  onExportProject,
  onImportProject,
  onOpenProjectsModal,
  onOpenLearnModal,
  onOpenChallengesModal,
  onOpenLibrariesModal,
  onOpenShareModal,
  onOpenSettingsModal,
  onOpenProfileModal,
  onOpenShortcutsModal,
  settings,
  onUpdateSettings,
  onToggleLeftSidebar,
  onToggleBottomPanel,
  isLeftSidebarOpen,
  isBottomPanelOpen,
  stdin = '',
  onOpenStdin,
  onOpenTerminal,
  detectedInput,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportProject(e.target.files[0]);
      e.target.value = '';
    }
  };

  const isDark = settings.theme === 'vs-dark';

  return (
    <header
      id="top-nav-bar"
      className={`h-11 border-b flex items-center justify-between px-3.5 select-none text-xs shrink-0 transition-colors z-40 ${
        isDark
          ? 'bg-[#0b0f17] border-[#1e293b] text-[#cbd5e1]'
          : 'bg-[#ffffff] border-[#e2e8f0] text-[#0f172a]'
      }`}
    >
      {/* Hidden File Input for Project Import */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".json"
        onChange={handleFileChange}
      />

      {/* Left: Brand + Menus + Primary Navigation */}
      <div className="flex items-center space-x-3" ref={menuContainerRef}>
        {/* Brand Identity - Codeforge Flame Logo */}
        <div className="flex items-center space-x-2 mr-1 pr-3 border-r border-[#1e293b]/80">
          <Logo size="sm" isDark={isDark} showSubtitle={false} />
        </div>

        {/* Menu Bar Dropdowns */}
        <div className="flex items-center space-x-1 text-xs text-[#94a3b8]">
          {/* File Menu */}
          <div className="relative">
            <button
              id="menu-btn-file"
              onClick={() => handleMenuClick('file')}
              className={`px-2 py-1 rounded hover:text-white hover:bg-[#1e293b]/60 transition-colors cursor-pointer ${
                activeMenu === 'file' ? 'text-white bg-[#1e293b]' : ''
              }`}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div
                id="dropdown-file"
                className={`absolute left-0 top-full mt-1 w-52 rounded-lg border shadow-xl py-1 z-50 backdrop-blur-md ${
                  isDark ? 'bg-[#0f172a] border-[#334155] text-[#cbd5e1]' : 'bg-white border-zinc-200 text-zinc-800'
                }`}
              >
                <button
                  id="menu-item-new-proj"
                  onClick={() => {
                    setActiveMenu(null);
                    onOpenProjectsModal();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] hover:text-white flex items-center justify-between text-xs cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="w-3.5 h-3.5 text-[#94a3b8]" /> Open / New Project
                  </span>
                  <span className="text-[10px] text-[#64748b] font-mono">Ctrl+O</span>
                </button>
                <button
                  id="menu-item-save"
                  onClick={() => {
                    setActiveMenu(null);
                    onSave();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] hover:text-white flex items-center justify-between text-xs cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Save className="w-3.5 h-3.5 text-[#94a3b8]" /> Save File
                  </span>
                  <span className="text-[10px] text-[#64748b] font-mono">Ctrl+S</span>
                </button>
                <button
                  id="menu-item-save-as"
                  onClick={() => {
                    setActiveMenu(null);
                    onSaveAs();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] hover:text-white flex items-center gap-2 text-xs cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-[#94a3b8]" /> Duplicate Project
                </button>
                <div className="h-px bg-[#1e293b] my-1" />
                <button
                  id="menu-item-download-c"
                  onClick={() => {
                    setActiveMenu(null);
                    onDownloadC();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] hover:text-white flex items-center gap-2 text-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#94a3b8]" /> Export Active .c File
                </button>
                <button
                  id="menu-item-export-json"
                  onClick={() => {
                    setActiveMenu(null);
                    onExportProject();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] hover:text-white flex items-center gap-2 text-xs cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 text-[#94a3b8]" /> Export Full Project (.json)
                </button>
                <button
                  id="menu-item-import-json"
                  onClick={() => {
                    setActiveMenu(null);
                    fileInputRef.current?.click();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] hover:text-white flex items-center gap-2 text-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#94a3b8]" /> Import Project (.json)
                </button>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative">
            <button
              id="menu-btn-edit"
              onClick={() => handleMenuClick('edit')}
              className={`px-2 py-1 rounded hover:text-white hover:bg-[#1e293b]/60 transition-colors cursor-pointer ${
                activeMenu === 'edit' ? 'text-white bg-[#1e293b]' : ''
              }`}
            >
              Edit
            </button>
            {activeMenu === 'edit' && (
              <div
                id="dropdown-edit"
                className={`absolute left-0 top-full mt-1 w-52 rounded-lg border shadow-xl py-1 z-50 backdrop-blur-md ${
                  isDark ? 'bg-[#0f172a] border-[#334155] text-[#cbd5e1]' : 'bg-white border-zinc-200'
                }`}
              >
                <div className="px-3 py-1 text-[10px] text-[#64748b] uppercase font-semibold">Editor Controls</div>
                <div className="px-3 py-1.5 flex justify-between text-[#94a3b8] text-xs">
                  <span>Find in Code</span> <span className="font-mono text-[10px] text-[#64748b]">Ctrl+F</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between text-[#94a3b8] text-xs">
                  <span>Replace</span> <span className="font-mono text-[10px] text-[#64748b]">Ctrl+H</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between text-[#94a3b8] text-xs">
                  <span>Command Palette</span> <span className="font-mono text-[10px] text-[#64748b]">F1</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between text-[#94a3b8] text-xs">
                  <span>Format Code</span> <span className="font-mono text-[10px] text-[#64748b]">Shift+Alt+F</span>
                </div>
              </div>
            )}
          </div>

          {/* View Menu */}
          <div className="relative">
            <button
              id="menu-btn-view"
              onClick={() => handleMenuClick('view')}
              className={`px-2 py-1 rounded hover:text-white hover:bg-[#1e293b]/60 transition-colors cursor-pointer ${
                activeMenu === 'view' ? 'text-white bg-[#1e293b]' : ''
              }`}
            >
              View
            </button>
            {activeMenu === 'view' && (
              <div
                id="dropdown-view"
                className={`absolute left-0 top-full mt-1 w-56 rounded-lg border shadow-xl py-1 z-50 backdrop-blur-md ${
                  isDark ? 'bg-[#0f172a] border-[#334155] text-[#cbd5e1]' : 'bg-white border-zinc-200'
                }`}
              >
                <button
                  id="menu-toggle-left-sidebar"
                  onClick={() => {
                    setActiveMenu(null);
                    onToggleLeftSidebar();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] hover:text-white flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>Project Explorer</span>
                  <span className="text-[10px] text-[#38bdf8] font-mono">{isLeftSidebarOpen ? 'Visible' : 'Hidden'}</span>
                </button>
                <button
                  id="menu-toggle-bottom-panel"
                  onClick={() => {
                    setActiveMenu(null);
                    onToggleBottomPanel();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] hover:text-white flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>Terminal & Output</span>
                  <span className="text-[10px] text-[#38bdf8] font-mono">{isBottomPanelOpen ? 'Visible' : 'Hidden'}</span>
                </button>
                <div className="h-px bg-[#1e293b] my-1" />
                <button
                  id="menu-toggle-minimap"
                  onClick={() => {
                    onUpdateSettings({ minimap: !settings.minimap });
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] hover:text-white flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>Editor Minimap</span>
                  <span className="text-[10px] text-[#64748b] font-mono">{settings.minimap ? 'ON' : 'OFF'}</span>
                </button>
                <button
                  id="menu-toggle-wrap"
                  onClick={() => {
                    onUpdateSettings({ wordWrap: settings.wordWrap === 'on' ? 'off' : 'on' });
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] hover:text-white flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>Word Wrap</span>
                  <span className="text-[10px] text-[#64748b] font-mono">{settings.wordWrap === 'on' ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Run Menu */}
          <div className="relative">
            <button
              id="menu-btn-run"
              onClick={() => handleMenuClick('run')}
              className={`px-2 py-1 rounded hover:text-white hover:bg-[#1e293b]/60 transition-colors cursor-pointer ${
                activeMenu === 'run' ? 'text-white bg-[#1e293b]' : ''
              }`}
            >
              Run
            </button>
            {activeMenu === 'run' && (
              <div
                id="dropdown-run"
                className={`absolute left-0 top-full mt-1 w-52 rounded-lg border shadow-xl py-1 z-50 backdrop-blur-md ${
                  isDark ? 'bg-[#0f172a] border-[#334155] text-[#cbd5e1]' : 'bg-white border-zinc-200'
                }`}
              >
                <button
                  id="menu-run-terminal"
                  onClick={() => {
                    setActiveMenu(null);
                    if (onRunInTerminal) {
                      onRunInTerminal();
                    } else if (onOpenTerminal) {
                      onOpenTerminal();
                    }
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] text-white flex items-center justify-between text-xs cursor-pointer font-medium"
                >
                  <span className="flex items-center gap-2 text-[#38bdf8]">
                    <TerminalIcon className="w-3.5 h-3.5 text-[#38bdf8]" /> Run in Terminal (Live I/O)
                  </span>
                  <span className="text-[10px] text-[#64748b] font-mono">F5</span>
                </button>
                <button
                  id="menu-run-exec"
                  onClick={() => {
                    setActiveMenu(null);
                    onRun();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] flex items-center justify-between font-medium text-[#cbd5e1] text-xs cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 fill-[#0076B8] text-[#0076B8]" /> Compile & Run (Batch)
                  </span>
                  <span className="text-[10px] text-[#64748b] font-mono">Ctrl+Enter</span>
                </button>
                <button
                  id="menu-run-compile"
                  onClick={() => {
                    setActiveMenu(null);
                    onCompileOnly();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] text-white flex items-center gap-2 text-xs cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5 text-[#94a3b8]" /> Compile Only (gcc -c)
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="h-4 w-px bg-[#1e293b] mx-1" />

        {/* Feature Hub Buttons: Projects, Learn, Challenges, C Libraries */}
        <div className="flex items-center space-x-1">
          <button
            id="nav-btn-projects"
            onClick={onOpenProjectsModal}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/60 transition-colors cursor-pointer font-medium"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#0076B8]" />
            <span>Projects</span>
          </button>
          <button
            id="nav-btn-libraries"
            onClick={onOpenLibrariesModal}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/60 transition-colors cursor-pointer font-medium"
            title="Browse supported C standard & POSIX headers"
          >
            <Layers className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>C Libraries</span>
          </button>
          <button
            id="nav-btn-learn"
            onClick={onOpenLearnModal}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/60 transition-colors cursor-pointer font-medium"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Lessons</span>
          </button>
          <button
            id="nav-btn-challenges"
            onClick={onOpenChallengesModal}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/60 transition-colors cursor-pointer font-medium"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Challenges</span>
          </button>
        </div>
      </div>

      {/* Center: Project Name & Realtime Save Status */}
      <div className="hidden lg:flex items-center space-x-2.5 text-xs px-3 py-1 rounded-md bg-[#0f172a]/60 border border-[#1e293b]">
        <div className="flex items-center gap-1.5 font-medium text-white max-w-[220px] truncate">
          <Code2 className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
          <span className="truncate">{project.name}</span>
        </div>
        <span className="text-[#334155]">•</span>
        <div className="flex items-center space-x-1.5">
          {saveStatus === 'saved' && (
            <span className="inline-flex items-center text-[11px] text-[#38bdf8] font-mono">
              <Check className="w-3 h-3 mr-1" /> Saved
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="inline-flex items-center text-[11px] text-amber-400 font-mono animate-pulse">
              Saving...
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="inline-flex items-center text-[11px] text-amber-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-ping" /> Unsaved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="inline-flex items-center text-[11px] text-rose-400 font-mono">
              Save failed
            </span>
          )}
        </div>
      </div>

      {/* Right: Primary Run Button & Studio Tools */}
      <div className="flex items-center space-x-2">
        {/* Compiler Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0f172a] border border-[#1e293b] text-[11px] font-mono text-[#94a3b8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0076B8]" />
          <span>{(settings.cStandard || 'c17').toUpperCase()} (GCC)</span>
        </div>

        {/* Primary Run & Stop Controls */}
        {isRunning ? (
          <div className="flex items-center space-x-1.5">
            <button
              id="btn-run-code"
              disabled
              className="bg-[#0076B8]/70 text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 cursor-wait shadow-sm opacity-90"
              title="C Program is currently running in Terminal"
            >
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Running...</span>
            </button>

            <button
              id="btn-stop-code"
              onClick={onStop}
              className="bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
              title="Stop running C program (Ctrl + C)"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          </div>
        ) : (
          <button
            id="btn-run-code"
            onClick={onRun}
            className="bg-[#0076B8] hover:bg-[#0088d4] active:bg-[#005f94] text-white px-4 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
            title="Compile and Execute C Program in Interactive Terminal (Ctrl + Enter / F5)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run</span>
            <span className="text-[10px] text-sky-200/80 font-mono hidden md:inline ml-1">⌘↵</span>
          </button>
        )}

        {/* Save Button */}
        <button
          id="btn-save-project"
          onClick={onSave}
          className="bg-[#1e293b] hover:bg-[#334155] border border-[#334155]/80 text-[#cbd5e1] hover:text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
          title="Save Project (Ctrl + S)"
        >
          Save
        </button>

        <div className="h-4 w-px bg-[#1e293b] mx-0.5" />

        {/* Sidebar & Panel Layout Toggles */}
        <button
          id="btn-toggle-left-sidebar"
          onClick={onToggleLeftSidebar}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            isLeftSidebarOpen
              ? 'bg-[#1e293b] text-white'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/60'
          }`}
          title="Toggle Explorer Sidebar"
        >
          <SidebarIcon className="w-3.5 h-3.5" />
        </button>

        <button
          id="btn-toggle-bottom-panel"
          onClick={onToggleBottomPanel}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            isBottomPanelOpen
              ? 'bg-[#1e293b] text-white'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/60'
          }`}
          title="Toggle Bottom Terminal/Output Panel"
        >
          <PanelBottom className="w-3.5 h-3.5" />
        </button>

        {/* Share Button */}
        <button
          id="btn-share-snippet"
          onClick={onOpenShareModal}
          className="p-1.5 rounded-md hover:bg-[#1e293b] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
          title="Share C Program Link"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        {/* Theme Toggle */}
        <button
          id="btn-toggle-theme"
          onClick={() => onUpdateSettings({ theme: isDark ? 'vs-light' : 'vs-dark' })}
          className="p-1.5 rounded-md hover:bg-[#1e293b] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
        </button>

        {/* Settings Button */}
        <button
          id="btn-open-settings"
          onClick={onOpenSettingsModal}
          className="p-1.5 rounded-md hover:bg-[#1e293b] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
          title="IDE & Compiler Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Shortcuts Help */}
        <button
          id="btn-shortcuts-help"
          onClick={onOpenShortcutsModal}
          className="p-1.5 rounded-md hover:bg-[#1e293b] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
          title="Keyboard Shortcuts Cheatsheet"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* Developer Profile */}
        <button
          id="btn-open-profile"
          onClick={onOpenProfileModal}
          className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-semibold hover:ring-2 hover:ring-sky-400/40 transition-all cursor-pointer shadow-xs"
          title="Developer Profile & Execution Stats"
        >
          CF
        </button>
      </div>
    </header>
  );
};
