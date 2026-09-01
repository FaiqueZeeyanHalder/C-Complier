import React, { useState } from 'react';
import {
  FolderPlus,
  FilePlus,
  Trash2,
  Edit2,
  FileCode,
  Folder,
  Search,
  ChevronRight,
  ChevronDown,
  Layers,
  Code2,
  Download,
  Plus,
  Sparkles,
  FileText,
  File,
} from 'lucide-react';
import { CProject, CProjectFile } from '../../shared/types.ts';

interface LeftSidebarProps {
  project: CProject;
  projectsList: CProject[];
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onSelectFile: (fileId: string) => void;
  onCreateFile: (name: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onDeleteFile: (fileId: string) => void;
  onDownloadFile: (file: CProjectFile) => void;
  onInsertSnippet: (snippet: string) => void;
  isDark: boolean;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  project,
  projectsList,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onDuplicateProject,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  onDownloadFile,
  onInsertSnippet,
  isDark,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'projects' | 'snippets'>('files');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      let name = newFileName.trim();
      if (!name.includes('.')) name += '.c';
      onCreateFile(name);
      setNewFileName('');
      setIsCreatingFile(false);
    }
  };

  const handleRenameSubmit = (fileId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editingFileName.trim()) {
      onRenameFile(fileId, editingFileName.trim());
      setEditingFileId(null);
    }
  };

  const C_SNIPPETS = [
    {
      title: 'Standard I/O Boilerplate',
      desc: '#include <stdio.h> and main()',
      code: `#include <stdio.h>

int main(void) {
    printf("Hello, World!\\n");
    return 0;
}
`,
    },
    {
      title: 'Dynamic Memory Allocation',
      desc: 'malloc + NULL check + free pattern',
      code: `int *arr = (int *)malloc(sizeof(int) * 10);
if (arr == NULL) {
    fprintf(stderr, "Memory allocation error\\n");
    return 1;
}
// Work with arr...
free(arr);
arr = NULL;
`,
    },
    {
      title: 'Struct with Typedef',
      desc: 'Custom type struct definition',
      code: `typedef struct {
    int id;
    char name[64];
    double value;
} Item;
`,
    },
    {
      title: 'Pointer Swap Helper',
      desc: 'Pass-by-reference value swap',
      code: `void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}
`,
    },
    {
      title: 'File Reading Stream',
      desc: 'Safe fopen and fgets line reader',
      code: `FILE *fp = fopen("data.txt", "r");
if (fp != NULL) {
    char buffer[256];
    while (fgets(buffer, sizeof(buffer), fp)) {
        printf("%s", buffer);
    }
    fclose(fp);
}
`,
    },
    {
      title: 'Binary Search Algorithm',
      desc: 'O(log N) lookup in sorted array',
      code: `int binary_search(const int arr[], int size, int target) {
    int low = 0, high = size - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}
`,
    },
  ];

  return (
    <aside
      id="left-sidebar"
      className={`w-60 h-full border-r flex flex-col shrink-0 select-none text-xs z-30 transition-colors ${
        isDark ? 'bg-[#090d14] border-[#1e293b] text-[#cbd5e1]' : 'bg-[#f8fafc] border-[#e2e8f0] text-[#334155]'
      }`}
    >
      {/* Tab Switcher */}
      <div
        className={`flex border-b text-[11px] font-medium shrink-0 ${
          isDark ? 'border-[#1e293b] bg-[#0b0f17]' : 'border-[#e2e8f0] bg-slate-100'
        }`}
      >
        <button
          id="sidebar-tab-files"
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'files'
              ? isDark
                ? 'bg-[#090d14] text-white border-b-2 border-[#0076B8] font-semibold'
                : 'bg-white text-[#0076B8] border-b-2 border-[#0076B8] font-semibold shadow-xs'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/40'
          }`}
          title="Project Workspace Files"
        >
          <Folder className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Files</span>
        </button>
        <button
          id="sidebar-tab-projects"
          onClick={() => setActiveTab('projects')}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'projects'
              ? isDark
                ? 'bg-[#090d14] text-white border-b-2 border-[#0076B8] font-semibold'
                : 'bg-white text-[#0076B8] border-b-2 border-[#0076B8] font-semibold shadow-xs'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/40'
          }`}
          title="Switch Projects"
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Projects</span>
        </button>
        <button
          id="sidebar-tab-snippets"
          onClick={() => setActiveTab('snippets')}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'snippets'
              ? isDark
                ? 'bg-[#090d14] text-white border-b-2 border-[#0076B8] font-semibold'
                : 'bg-white text-[#0076B8] border-b-2 border-[#0076B8] font-semibold shadow-xs'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/40'
          }`}
          title="C Code Snippets"
        >
          <Code2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Snippets</span>
        </button>
      </div>

      {/* Tab 1: Project Files Tree */}
      {activeTab === 'files' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Actions */}
          <div className="px-3 py-2 border-b flex items-center justify-between border-[#1e293b] text-[10px] uppercase font-bold text-[#64748b] tracking-wider">
            <span>EXPLORER</span>
            <button
              id="btn-new-file"
              onClick={() => setIsCreatingFile(true)}
              className="p-1 rounded hover:bg-[#1e293b] text-[#94a3b8] hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-sans"
              title="Create new C file or header (*.c / *.h)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* New File Form */}
          {isCreatingFile && (
            <form onSubmit={handleCreateFileSubmit} className="p-2 border-b border-[#1e293b] bg-[#0f172a]">
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  autoFocus
                  placeholder="module.c or header.h"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className={`w-full px-2 py-1 text-xs rounded border outline-none font-mono ${
                    isDark ? 'bg-[#080c13] border-[#334155] text-white focus:border-[#0076B8]' : 'bg-white border-zinc-300 text-zinc-900'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsCreatingFile(false);
                  }}
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-[#0076B8] hover:bg-[#0088d4] text-white rounded text-[10px] font-semibold cursor-pointer"
                >
                  Add
                </button>
              </div>
            </form>
          )}

          {/* Active Project Folder Name */}
          <div className="flex items-center px-3 py-1.5 bg-[#0b0f17] text-white text-xs border-b border-[#1e293b]/60 font-medium">
            <ChevronDown className="w-3.5 h-3.5 mr-1.5 text-[#38bdf8]" />
            <span className="truncate">{project.name}</span>
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto py-1 space-y-0.5 text-xs">
            {project.files.map((file) => {
              const isActive = project.activeFileId === file.id;
              const isEditing = editingFileId === file.id;
              const isHeader = file.name.endsWith('.h');

              return (
                <div
                  key={file.id}
                  id={`file-item-${file.id}`}
                  onClick={() => !isEditing && onSelectFile(file.id)}
                  className={`group px-3 py-1.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isActive
                      ? isDark
                        ? 'bg-[#1e293b] text-[#38bdf8] font-semibold'
                        : 'bg-[#0076B8]/10 text-[#0076B8] font-semibold'
                      : isDark
                      ? 'hover:bg-[#0f172a] text-[#cbd5e1]'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span
                      className={`font-mono text-[10px] font-bold px-1 py-0.2 rounded ${
                        isHeader ? 'bg-sky-950/60 text-sky-400 border border-sky-800/40' : 'bg-[#0076B8]/20 text-[#38bdf8] border border-[#0076B8]/40'
                      }`}
                    >
                      {isHeader ? 'H' : 'C'}
                    </span>

                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleRenameSubmit(file.id, e)}
                        className="flex-1 flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          autoFocus
                          value={editingFileName}
                          onChange={(e) => setEditingFileName(e.target.value)}
                          onBlur={() => setEditingFileId(null)}
                          className={`w-full px-1.5 py-0.5 rounded border text-xs font-mono outline-none ${
                            isDark ? 'bg-[#080c13] border-[#334155] text-white' : 'bg-white border-zinc-300'
                          }`}
                        />
                      </form>
                    ) : (
                      <span className="truncate font-mono text-xs">{file.name}</span>
                    )}
                  </div>

                  {/* Actions on hover */}
                  {!isEditing && (
                    <div
                      className="hidden group-hover:flex items-center space-x-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditingFileId(file.id);
                          setEditingFileName(file.name);
                        }}
                        className="p-1 rounded hover:bg-[#334155] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
                        title="Rename file"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDownloadFile(file)}
                        className="p-1 rounded hover:bg-[#334155] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
                        title="Download file"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      {project.files.length > 1 && (
                        <button
                          onClick={() => onDeleteFile(file.id)}
                          className="p-1 rounded hover:bg-rose-950 hover:text-rose-400 text-[#94a3b8] transition-colors cursor-pointer"
                          title="Delete file"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Projects List */}
      {activeTab === 'projects' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b flex items-center justify-between border-[#1e293b] text-[10px] uppercase font-bold text-[#64748b] tracking-wider">
            <span>SAVED PROJECTS ({projectsList.length})</span>
            <button
              onClick={onNewProject}
              className="p-1 rounded hover:bg-[#1e293b] text-[#94a3b8] hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-sans"
              title="Create new project"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {projectsList.map((p) => {
              const isActive = p.id === project.id;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0076B8]/15 border-[#0076B8]/50 text-white font-medium shadow-xs'
                      : 'bg-[#0b0f17] border-[#1e293b] text-[#cbd5e1] hover:border-[#334155]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs truncate max-w-[150px]">{p.name}</span>
                    <span className="text-[10px] text-[#64748b] font-mono">{p.files.length} files</span>
                  </div>
                  {p.description && (
                    <p className="text-[11px] text-[#94a3b8] truncate mt-0.5 font-sans">{p.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: C Code Snippets */}
      {activeTab === 'snippets' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-[#1e293b] text-[10px] uppercase font-bold text-[#64748b] tracking-wider">
            <span>C SNIPPETS & PATTERNS</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {C_SNIPPETS.map((snip, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-[#1e293b] bg-[#0b0f17] hover:border-[#334155] transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">{snip.title}</span>
                  <button
                    onClick={() => onInsertSnippet(snip.code)}
                    className="px-2 py-0.5 rounded bg-[#0076B8]/20 hover:bg-[#0076B8]/35 text-[#38bdf8] border border-[#0076B8]/35 text-[10px] font-sans font-semibold cursor-pointer"
                    title="Insert snippet into active editor"
                  >
                    Insert
                  </button>
                </div>
                <p className="text-[11px] text-[#94a3b8] font-sans leading-relaxed">{snip.desc}</p>
                <pre className="p-1.5 rounded bg-[#080c13] text-[#a5d6ff] font-mono text-[10px] overflow-hidden truncate">
                  {snip.code.slice(0, 50)}...
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
