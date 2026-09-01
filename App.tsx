import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CProject,
  CProjectFile,
  EditorSettings,
  ExecutionResult,
  ProblemItem,
  UserProfile,
} from '../shared/types.ts';
import {
  loadProjects,
  saveProject,
  deleteProject,
  loadSettings,
  saveSettings,
  loadProfile,
  saveProfile,
  recordRunExecution,
} from './services/storageService.ts';
import { compileCode, runCode } from './services/apiService.ts';
import {
  downloadFile,
  exportProjectAsJSON,
  readSharedSnippetFromUrl,
} from './services/exportService.ts';
import { createDefaultProject } from './data/defaultProject.ts';
import { TopNav } from './components/TopNav.tsx';
import { LeftSidebar } from './components/LeftSidebar.tsx';
import { EditorArea } from './components/EditorArea.tsx';
import { BottomPanel } from './components/BottomPanel.tsx';
import { ProjectsDashboard } from './components/ProjectsDashboard.tsx';
import { LearnModal } from './components/LearnModal.tsx';
import { ChallengesModal } from './components/ChallengesModal.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { LibrariesModal } from './components/LibrariesModal.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { ShortcutsModal } from './components/ShortcutsModal.tsx';
import { InputPromptModal } from './components/InputPromptModal.tsx';
import { detectInputFunctions } from './utils/cInputDetector.ts';

export const App: React.FC = () => {
  // 1. Projects & Active State
  const [projects, setProjects] = useState<CProject[]>([]);
  const [activeProject, setActiveProject] = useState<CProject>(createDefaultProject());
  const [unsavedFiles, setUnsavedFiles] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');

  // 2. Settings & Profile
  const [settings, setSettings] = useState<EditorSettings>(loadSettings());
  const [profile, setProfile] = useState<UserProfile>(loadProfile());

  // 3. Execution & Compiler State
  const [stdin, setStdin] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [highlightLine, setHighlightLine] = useState<{ file?: string; line?: number } | null>(null);

  // 4. Panel Layout & Visibility
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const [isBottomMaximized, setIsBottomMaximized] = useState(false);
  const [bottomActiveTab, setBottomActiveTab] = useState<'terminal' | 'output' | 'input' | 'problems'>('terminal');

  // 5. Modal States
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showLearnModal, setShowLearnModal] = useState(false);
  const [showChallengesModal, setShowChallengesModal] = useState(false);
  const [showLibrariesModal, setShowLibrariesModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showInputPromptModal, setShowInputPromptModal] = useState(false);
  const [terminalRunTrigger, setTerminalRunTrigger] = useState<number>(0);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleRunInTerminal = useCallback(() => {
    setIsBottomPanelOpen(true);
    setBottomActiveTab('terminal');
    setTerminalRunTrigger(Date.now());
  }, []);

  const handleRun = useCallback(() => {
    handleRunInTerminal();
  }, [handleRunInTerminal]);

  // Initial Load from Storage or URL snippet
  useEffect(() => {
    loadProjects().then((loadedProjects) => {
      if (loadedProjects && loadedProjects.length > 0) {
        setProjects(loadedProjects);
        setActiveProject(loadedProjects[0]);
      } else {
        const defaultProj = createDefaultProject();
        saveProject(defaultProj);
        setProjects([defaultProj]);
        setActiveProject(defaultProj);
      }

      // Check URL for shared snippet
      const shared = readSharedSnippetFromUrl();
      if (shared && shared.code) {
        const sharedProj: CProject = {
          id: 'shared-' + Date.now(),
          name: 'Shared C Program',
          description: 'Loaded from shared URL link',
          files: [
            {
              id: 'file-shared',
              name: 'main.c',
              path: 'main.c',
              content: shared.code,
              updatedAt: Date.now(),
            },
          ],
          activeFileId: 'file-shared',
          openFileIds: ['file-shared'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        saveProject(sharedProj);
        setProjects((prev) => [sharedProj, ...prev]);
        setActiveProject(sharedProj);
        if (shared.stdin) setStdin(shared.stdin);
      }
    });
  }, []);

  // Save Project Logic
  const handleSave = useCallback(
    async (projToSave = activeProject) => {
      setSaveStatus('saving');
      try {
        const updated = { ...projToSave, updatedAt: Date.now() };
        await saveProject(updated);
        setActiveProject(updated);
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setUnsavedFiles(new Set());
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to save project:', err);
        setSaveStatus('error');
      }
    },
    [activeProject]
  );

  // Auto-Save with Debounce
  const triggerAutoSave = (updatedProj: CProject) => {
    setSaveStatus('unsaved');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(updatedProj);
    }, settings.autoSaveDelay || 2000);
  };

  // Editor Content Change
  const handleContentChange = (newContent: string) => {
    if (!activeProject) return;
    const currentFileId = activeProject.activeFileId;

    const updatedFiles = activeProject.files.map((f) =>
      f.id === currentFileId ? { ...f, content: newContent, updatedAt: Date.now() } : f
    );

    const updatedProject = {
      ...activeProject,
      files: updatedFiles,
    };

    setActiveProject(updatedProject);
    setUnsavedFiles((prev) => new Set(prev).add(currentFileId));
    triggerAutoSave(updatedProject);
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: Partial<EditorSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveSettings(updated);
  };

  // Run C Program
  const handleExecuteWithStdin = async (inputToUse?: string) => {
    if (isRunning || !activeProject) return;

    const currentFile = activeProject.files.find((f) => f.id === activeProject.activeFileId);
    const codeContent = currentFile?.content || '';
    const finalStdin = inputToUse !== undefined ? inputToUse : stdin;

    // Auto save before running
    await handleSave(activeProject);

    setIsRunning(true);
    setBottomActiveTab('output');

    try {
      const result = await runCode({
        code: codeContent,
        files: activeProject.files.map((f) => ({ name: f.name, content: f.content })),
        stdin: finalStdin,
        standard: settings.cStandard || 'c17',
        compilerFlags: ['-Wall', '-Wextra', '-O2', '-lm'],
        activeFileName: currentFile?.name || activeFile?.name,
      });

      setExecutionResult(result);
      setProblems(result.problems || []);

      if (!result.success && result.problems && result.problems.length > 0) {
        // If there are errors, make problems visible
        if (!result.stdout) setBottomActiveTab('problems');
      }

      // Record run stats in profile
      recordRunExecution();
      setProfile(loadProfile());
    } catch (err: any) {
      const fallbackResult: ExecutionResult = {
        success: false,
        stdout: '',
        stderr: err.message || 'Execution failed',
        compileError: '',
        runtimeError: err.message || 'Execution failed',
        executionTime: 0,
        compilerCommand: 'gcc ...',
        problems: [
          {
            type: 'error',
            message: err.message || 'Execution error',
            raw: err.message || 'Execution error',
          },
        ],
      };
      setExecutionResult(fallbackResult);
      setProblems(fallbackResult.problems || []);
      setBottomActiveTab('problems');
    } finally {
      setIsRunning(false);
    }
  };

  // Compile Only (gcc -c)
  const handleCompileOnly = async () => {
    if (isRunning || !activeProject) return;
    await handleSave(activeProject);

    setIsRunning(true);
    setBottomActiveTab('problems');

    try {
      const result = await compileCode({
        code: activeFile?.content || '',
        files: activeProject.files.map((f) => ({ name: f.name, content: f.content })),
        standard: settings.cStandard || 'c17',
        compilerFlags: ['-Wall', '-Wextra', '-O2'],
        activeFileName: activeFile?.name,
      });

      setExecutionResult(result);
      setProblems(result.problems || []);
    } catch (err: any) {
      setExecutionResult({
        success: false,
        stdout: '',
        stderr: err.message,
        compileError: err.message,
        runtimeError: '',
        executionTime: 0,
        compilerCommand: 'gcc -c ...',
        problems: [{ type: 'error', message: err.message, raw: err.message }],
      });
    } finally {
      setIsRunning(false);
    }
  };

  // File Management
  const handleSelectFile = (fileId: string) => {
    setActiveProject((prev) => ({
      ...prev,
      activeFileId: fileId,
      openFileIds: prev.openFileIds.includes(fileId) ? prev.openFileIds : [...prev.openFileIds, fileId],
    }));
  };

  const handleCreateFile = (name: string) => {
    const newFile: CProjectFile = {
      id: 'file-' + Date.now(),
      name,
      path: name,
      updatedAt: Date.now(),
      content: name.endsWith('.h')
        ? `#ifndef ${name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}\n#define ${name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}\n\n// Declarations\n\n#endif\n`
        : `#include <stdio.h>\n\n// Implementation\n`,
    };

    const updatedProj: CProject = {
      ...activeProject,
      files: [...activeProject.files, newFile],
      activeFileId: newFile.id,
      openFileIds: [...activeProject.openFileIds, newFile.id],
    };

    setActiveProject(updatedProj);
    handleSave(updatedProj);
  };

  const handleRenameFile = (fileId: string, newName: string) => {
    const updatedFiles = activeProject.files.map((f) =>
      f.id === fileId ? { ...f, name: newName, path: newName, updatedAt: Date.now() } : f
    );
    const updatedProj = { ...activeProject, files: updatedFiles };
    setActiveProject(updatedProj);
    handleSave(updatedProj);
  };

  const handleDeleteFile = (fileId: string) => {
    if (activeProject.files.length <= 1) return;
    const remainingFiles = activeProject.files.filter((f) => f.id !== fileId);
    const newActiveId =
      activeProject.activeFileId === fileId ? remainingFiles[0].id : activeProject.activeFileId;
    const newOpenIds = activeProject.openFileIds.filter((id) => id !== fileId);

    const updatedProj: CProject = {
      ...activeProject,
      files: remainingFiles,
      activeFileId: newActiveId,
      openFileIds: newOpenIds.length > 0 ? newOpenIds : [remainingFiles[0].id],
    };

    setActiveProject(updatedProj);
    handleSave(updatedProj);
  };

  const handleCloseTab = (fileId: string) => {
    const remainingOpen = activeProject.openFileIds.filter((id) => id !== fileId);
    if (remainingOpen.length === 0) return; // Keep at least one tab open

    const newActiveId =
      activeProject.activeFileId === fileId
        ? remainingOpen[remainingOpen.length - 1]
        : activeProject.activeFileId;

    setActiveProject((prev) => ({
      ...prev,
      activeFileId: newActiveId,
      openFileIds: remainingOpen,
    }));
  };

  // Project Management
  const handleSelectProject = (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (target) {
      setActiveProject(target);
      setExecutionResult(null);
      setProblems([]);
    }
  };

  const handleCreateNewProject = (name: string, description?: string) => {
    const newProj: CProject = {
      id: 'proj-' + Date.now(),
      name,
      description: description || 'C programming project',
      files: [
        {
          id: 'file-' + Date.now(),
          name: 'main.c',
          path: 'main.c',
          updatedAt: Date.now(),
          content: `#include <stdio.h>\n\nint main(void) {\n    printf("Hello from ${name}!\\n");\n    return 0;\n}\n`,
        },
      ],
      activeFileId: '',
      openFileIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    newProj.activeFileId = newProj.files[0].id;
    newProj.openFileIds = [newProj.files[0].id];

    saveProject(newProj);
    setProjects((prev) => [newProj, ...prev]);
    setActiveProject(newProj);
    setExecutionResult(null);
    setProblems([]);
  };

  const handleCreateFromTemplate = (templateFn: () => CProject) => {
    const tpl = templateFn();
    saveProject(tpl);
    setProjects((prev) => [tpl, ...prev]);
    setActiveProject(tpl);
    setExecutionResult(null);
    setProblems([]);
  };

  const handleDuplicateProject = (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;

    const copyProj: CProject = {
      ...target,
      id: 'proj-' + Date.now(),
      name: `${target.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveProject(copyProj);
    setProjects((prev) => [copyProj, ...prev]);
  };

  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) return;
    deleteProject(projectId);
    const remaining = projects.filter((p) => p.id !== projectId);
    setProjects(remaining);
    if (activeProject.id === projectId) {
      setActiveProject(remaining[0]);
    }
  };

  const handleImportProject = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.files && Array.isArray(parsed.files)) {
          const imported: CProject = {
            ...parsed,
            id: 'proj-imported-' + Date.now(),
            name: (parsed.name || 'Imported C Project') + ' (Imported)',
            updatedAt: Date.now(),
          };
          saveProject(imported);
          setProjects((prev) => [imported, ...prev]);
          setActiveProject(imported);
        }
      } catch (err) {
        alert('Invalid JSON project export file.');
      }
    };
    reader.readAsText(file);
  };

  // Keyboard Shortcuts Global Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        handleRunInTerminal();
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleRunInTerminal();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        setShowProjectsModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun, handleSave, handleRunInTerminal]);

  const activeFile = activeProject?.files.find((f) => f.id === activeProject.activeFileId);
  const detectedInput = detectInputFunctions(activeFile?.content || '');
  const isDark = settings.theme === 'vs-dark';

  return (
    <div
      id="codeforge-app-root"
      className={`h-screen w-screen flex flex-col overflow-hidden font-sans ${
        isDark ? 'bg-[#010409] text-[#c9d1d9]' : 'bg-[#ffffff] text-[#0f172a]'
      }`}
    >
      {/* 1. Top Bar */}
      <TopNav
        project={activeProject}
        saveStatus={saveStatus}
        isRunning={isRunning}
        onRun={() => handleRun()}
        onStop={() => {
          // Send interrupt or trigger stop
          fetch('/api/terminal/kill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signal: 'SIGINT' }),
          }).catch(() => {});
          setIsRunning(false);
        }}
        onRunInTerminal={handleRunInTerminal}
        onCompileOnly={handleCompileOnly}
        onSave={() => handleSave()}
        onSaveAs={() => handleDuplicateProject(activeProject.id)}
        onDownloadC={() => activeFile && downloadFile(activeFile)}
        onExportProject={() => exportProjectAsJSON(activeProject)}
        onImportProject={handleImportProject}
        onOpenProjectsModal={() => setShowProjectsModal(true)}
        onOpenLearnModal={() => setShowLearnModal(true)}
        onOpenChallengesModal={() => setShowChallengesModal(true)}
        onOpenLibrariesModal={() => setShowLibrariesModal(true)}
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenSettingsModal={() => setShowSettingsModal(true)}
        onOpenProfileModal={() => setShowProfileModal(true)}
        onOpenShortcutsModal={() => setShowShortcutsModal(true)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onToggleBottomPanel={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
        isLeftSidebarOpen={isLeftSidebarOpen}
        isBottomPanelOpen={isBottomPanelOpen}
        stdin={stdin}
        onOpenStdin={() => {
          setIsBottomPanelOpen(true);
          setBottomActiveTab('input');
        }}
        onOpenTerminal={() => {
          setIsBottomPanelOpen(true);
          setBottomActiveTab('terminal');
        }}
        detectedInput={detectedInput}
      />

      {/* 2. Main Workbench Area */}
      <div id="workbench-container" className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        {isLeftSidebarOpen && (
          <LeftSidebar
            project={activeProject}
            projectsList={projects}
            onSelectProject={handleSelectProject}
            onNewProject={() => setShowProjectsModal(true)}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onRenameFile={handleRenameFile}
            onDeleteFile={handleDeleteFile}
            onDownloadFile={downloadFile}
            onInsertSnippet={(snippet) => {
              if (activeFile) {
                handleContentChange(activeFile.content + '\n' + snippet);
              }
            }}
            isDark={isDark}
          />
        )}

        {/* Center Canvas: Editor + Bottom Output/Terminal Panel */}
        <main id="center-editor-column" className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Monaco Editor */}
          <EditorArea
            project={activeProject}
            activeFile={activeFile}
            unsavedFiles={unsavedFiles}
            onContentChange={handleContentChange}
            onSelectTab={handleSelectFile}
            onCloseTab={handleCloseTab}
            onNewFile={() => handleCreateFile('untitled.c')}
            onRun={() => handleRun()}
            onSave={() => handleSave()}
            settings={settings}
            problems={problems}
            highlightLine={highlightLine}
          />

          {/* Bottom Panel (I/O, Output, Problems, Terminal) */}
          {isBottomPanelOpen && (
            <BottomPanel
              activeTab={bottomActiveTab}
              onSelectTab={setBottomActiveTab}
              stdin={stdin}
              onStdinChange={setStdin}
              executionResult={executionResult}
              isRunning={isRunning}
              onClearOutput={() => setExecutionResult(null)}
              onJumpToProblem={(prob) => {
                if (prob.file) {
                  const targetFile = activeProject.files.find((f) => f.name === prob.file);
                  if (targetFile) handleSelectFile(targetFile.id);
                }
                setHighlightLine({ file: prob.file, line: prob.line });
              }}
              isDark={isDark}
              isMaximized={isBottomMaximized}
              onToggleMaximize={() => setIsBottomMaximized(!isBottomMaximized)}
              onRun={() => handleRunInTerminal()}
              onStop={() => {
                fetch('/api/terminal/kill', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ signal: 'SIGINT' }),
                }).catch(() => {});
                setIsRunning(false);
              }}
              detectedInput={detectedInput}
              files={activeProject.files}
              activeFile={activeFile}
              terminalRunTrigger={terminalRunTrigger}
              cStandard={settings.cStandard}
              onStateChange={(state) => {
                setIsRunning(state === 'compiling' || state === 'running');
              }}
              onProblemsDetected={(newProblems) => {
                setProblems(newProblems);
              }}
            />
          )}
        </main>
      </div>

      {/* 3. Global Modals */}
      {showInputPromptModal && (
        <InputPromptModal
          initialStdin={stdin}
          detectedFunctions={detectedInput.functions}
          onRun={(providedStdin) => {
            setStdin(providedStdin);
            setShowInputPromptModal(false);
            handleExecuteWithStdin(providedStdin);
          }}
          onRunInTerminal={() => {
            setShowInputPromptModal(false);
            handleRunInTerminal();
          }}
          onClose={() => setShowInputPromptModal(false)}
          isDark={isDark}
        />
      )}

      {showProjectsModal && (
        <ProjectsDashboard
          projects={projects}
          activeProjectId={activeProject.id}
          onOpenProject={handleSelectProject}
          onCreateNewProject={handleCreateNewProject}
          onCreateFromTemplate={handleCreateFromTemplate}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
          onExportProject={exportProjectAsJSON}
          onClose={() => setShowProjectsModal(false)}
          isDark={isDark}
        />
      )}

      {showLearnModal && (
        <LearnModal
          onLoadLessonCode={(code, title) => {
            handleCreateNewProject(`Learn: ${title}`);
            setTimeout(() => {
              handleContentChange(code);
            }, 100);
          }}
          onClose={() => setShowLearnModal(false)}
          isDark={isDark}
        />
      )}

      {showChallengesModal && (
        <ChallengesModal
          currentCode={activeFile?.content || ''}
          onLoadChallengeCode={(starterCode, title) => {
            handleCreateNewProject(`Challenge: ${title}`);
            setTimeout(() => {
               handleContentChange(starterCode);
            }, 100);
          }}
          onClose={() => setShowChallengesModal(false)}
          isDark={isDark}
        />
      )}

      {showLibrariesModal && (
        <LibrariesModal
          onInsertHeader={(headerName) => {
            if (activeFile) {
              const headerLine = `#include <${headerName}>\n`;
              if (!activeFile.content.includes(`<${headerName}>`)) {
                handleContentChange(headerLine + activeFile.content);
              }
            }
          }}
          onClose={() => setShowLibrariesModal(false)}
          isDark={isDark}
        />
      )}

      {showShareModal && (
        <ShareModal
          code={activeFile?.content || ''}
          stdin={stdin}
          projectName={activeProject.name}
          onClose={() => setShowShareModal(false)}
          isDark={isDark}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettingsModal(false)}
          isDark={isDark}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          profile={profile}
          totalProjects={projects.length}
          onClose={() => setShowProfileModal(false)}
          isDark={isDark}
        />
      )}

      {showShortcutsModal && (
        <ShortcutsModal
          onClose={() => setShowShortcutsModal(false)}
          isDark={isDark}
        />
      )}
    </div>
  );
};
