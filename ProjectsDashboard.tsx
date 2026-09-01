import React, { useState } from 'react';
import {
  Folder,
  Plus,
  Search,
  Copy,
  Trash2,
  Download,
  Calendar,
  FileCode,
  ArrowRight,
  X,
  Sparkles,
  Layers,
} from 'lucide-react';
import { CProject } from '../../shared/types.ts';
import { TEMPLATE_PROJECTS } from '../data/defaultProject.ts';

interface ProjectsDashboardProps {
  projects: CProject[];
  activeProjectId: string;
  onOpenProject: (projectId: string) => void;
  onCreateNewProject: (name: string, description?: string) => void;
  onCreateFromTemplate: (templateProject: () => CProject) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onExportProject: (project: CProject) => void;
  onClose: () => void;
  isDark: boolean;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  projects,
  activeProjectId,
  onOpenProject,
  onCreateNewProject,
  onCreateFromTemplate,
  onDuplicateProject,
  onDeleteProject,
  onExportProject,
  onClose,
  isDark,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'created'>('updated');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  const filteredProjects = projects
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'created') return b.createdAt - a.createdAt;
      return b.updatedAt - a.updatedAt;
    });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjName.trim()) {
      onCreateNewProject(newProjName.trim(), newProjDesc.trim());
      setNewProjName('');
      setNewProjDesc('');
      setIsCreatingNew(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="projects-dashboard-modal"
        className={`w-full max-w-4xl max-h-[85vh] rounded-xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-[#18181b] border-[#27272a] text-[#e4e4e7]' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-[#141416] border-[#27272a]' : 'bg-slate-50 border-zinc-200'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#0076B8]/15 border border-[#0076B8]/40 flex items-center justify-center text-[#38bdf8]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">C Projects Dashboard</h2>
              <p className="text-xs text-zinc-400">Manage, organize, and create your C programs</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-500/15 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Action Row & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search projects by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border outline-none ${
                  isDark ? 'bg-[#27272a] border-[#3f3f46] text-white' : 'bg-zinc-50 border-zinc-300'
                }`}
              />
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`px-3 py-2 text-xs rounded-lg border outline-none ${
                  isDark ? 'bg-[#27272a] border-[#3f3f46] text-white' : 'bg-zinc-50 border-zinc-300'
                }`}
              >
                <option value="updated">Recently Updated</option>
                <option value="created">Recently Created</option>
                <option value="name">Alphabetical</option>
              </select>

              <button
                id="btn-modal-new-proj"
                onClick={() => setIsCreatingNew(true)}
                className="px-3 py-2 bg-[#0076B8] hover:bg-[#0088d4] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New Project
              </button>
            </div>
          </div>

          {/* New Project Form Modal Inline */}
          {isCreatingNew && (
            <form onSubmit={handleCreateSubmit} className="p-4 rounded-xl border border-[#0076B8]/40 bg-[#0076B8]/10 space-y-3">
              <h3 className="font-semibold text-xs text-[#38bdf8]">Create New C Project</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  autoFocus
                  placeholder="Project Name (e.g. DataStructures_Lab1)"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className={`px-3 py-2 text-xs rounded border outline-none ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Optional Description..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className={`px-3 py-2 text-xs rounded border outline-none ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300'
                  }`}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#0076B8] hover:bg-[#0088d4] text-white rounded text-xs font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {/* Starter Project Templates Section */}
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Starter C Templates
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {TEMPLATE_PROJECTS.map((tpl, i) => (
                <div
                  key={i}
                  onClick={() => {
                    onCreateFromTemplate(tpl.project);
                    onClose();
                  }}
                  className={`p-3 rounded-lg border cursor-pointer group transition-all ${
                    isDark
                      ? 'bg-[#1f1f23] border-[#2e2e34] hover:border-[#0076B8]/60 hover:bg-[#25252b]'
                      : 'bg-zinc-50 border-zinc-200 hover:border-[#0076B8] hover:bg-[#0076B8]/10'
                  }`}
                >
                  <div className="font-semibold text-xs text-[#38bdf8] group-hover:text-white flex items-center justify-between">
                    <span>{tpl.name}</span>
                    <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{tpl.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Projects List Grid */}
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-zinc-400 mb-3">
              All Projects ({filteredProjects.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProjects.map((p) => {
                const isActive = p.id === activeProjectId;
                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                      isActive
                        ? isDark
                          ? 'bg-[#0076B8]/15 border-[#0076B8]/50 shadow-xs'
                          : 'bg-[#0076B8]/10 border-[#0076B8]/50'
                        : isDark
                        ? 'bg-[#1f1f23] border-[#2e2e34] hover:border-zinc-500/30'
                        : 'bg-white border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <Folder className={`w-4 h-4 ${isActive ? 'text-[#38bdf8]' : 'text-zinc-400'}`} />
                          <h4 className="font-bold text-sm">{p.name}</h4>
                        </div>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#0076B8]/25 text-[#38bdf8] border border-[#0076B8]/40">
                            Current
                          </span>
                        )}
                      </div>

                      {p.description && (
                        <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2">{p.description}</p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-3 font-mono">
                        <span className="flex items-center gap-1">
                          <FileCode className="w-3 h-3" /> {p.files.length} {p.files.length === 1 ? 'file' : 'files'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(p.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-current/10 flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onDuplicateProject(p.id)}
                          className="p-1.5 rounded hover:bg-zinc-500/15 text-zinc-400 hover:text-white"
                          title="Duplicate Project"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onExportProject(p)}
                          className="p-1.5 rounded hover:bg-zinc-500/15 text-zinc-400 hover:text-white"
                          title="Export Project JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {projects.length > 1 && (
                          <button
                            onClick={() => onDeleteProject(p.id)}
                            className="p-1.5 rounded hover:bg-rose-500/15 text-zinc-400 hover:text-rose-400"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          onOpenProject(p.id);
                          onClose();
                        }}
                        className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#0076B8] text-white'
                            : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                        }`}
                      >
                        {isActive ? 'Editing' : 'Open'} <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
