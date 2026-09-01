import React, { useState, useEffect } from 'react';
import { BookOpen, X, Search, CheckCircle2, AlertCircle, Terminal, Copy, Check, Sparkles, Filter, Code2 } from 'lucide-react';
import { CompilerEnvironmentInfo, CHeaderInfo } from '../../shared/types.ts';
import { getCompilerInfo } from '../services/apiService.ts';

interface LibrariesModalProps {
  onClose: () => void;
  onInsertHeader?: (headerName: string) => void;
  isDark: boolean;
}

export const LibrariesModal: React.FC<LibrariesModalProps> = ({
  onClose,
  onInsertHeader,
  isDark,
}) => {
  const [compilerInfo, setCompilerInfo] = useState<CompilerEnvironmentInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'standard' | 'posix'>('all');
  const [selectedHeader, setSelectedHeader] = useState<CHeaderInfo | null>(null);
  const [copiedHeader, setCopiedHeader] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getCompilerInfo()
      .then((info) => {
        if (isMounted) {
          setCompilerInfo(info);
          if (info.availableHeaders.length > 0) {
            setSelectedHeader(info.availableHeaders[0]);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load compiler information:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const headers = compilerInfo?.availableHeaders || [];

  const filteredHeaders = headers.filter((h) => {
    const matchesCategory = selectedCategory === 'all' || h.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      h.name.toLowerCase().includes(q) ||
      h.description.toLowerCase().includes(q) ||
      h.commonFunctions.some((f) => f.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const handleCopyInclude = (headerName: string) => {
    const text = `#include <${headerName}>`;
    navigator.clipboard.writeText(text);
    setCopiedHeader(headerName);
    setTimeout(() => setCopiedHeader(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="libraries-modal-container"
        className={`w-full max-w-4xl h-[85vh] max-h-[720px] rounded-xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-[#0f172a] border-[#334155] text-[#e2e8f0]' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'bg-[#0b0f17] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#0076B8]/15 border border-[#0076B8]/40 flex items-center justify-center text-[#38bdf8]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">C Standard Libraries & Headers</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#0076B8]/20 border border-[#0076B8]/40 text-[#38bdf8]">
                  {compilerInfo ? compilerInfo.version : 'GCC Environment'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Verified toolchain headers with ISO C standards & POSIX support
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-zinc-500/15 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className={`p-3 border-b flex flex-wrap items-center justify-between gap-2.5 shrink-0 ${isDark ? 'bg-[#0b101b] border-[#1e293b]' : 'bg-slate-100 border-slate-200'}`}>
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search headers, functions (e.g. sqrt, printf, time, pthread)..."
              className={`w-full pl-8.5 pr-3 py-1.5 rounded-lg border text-xs outline-none focus:ring-1 focus:ring-[#0076B8] ${
                isDark ? 'bg-[#080c14] border-[#1e293b] text-white placeholder-zinc-500' : 'bg-white border-zinc-300 placeholder-zinc-400'
              }`}
            />
          </div>

          <div className="flex items-center space-x-1 p-1 bg-zinc-500/10 rounded-lg text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                selectedCategory === 'all' ? 'bg-[#0076B8] text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({headers.length})
            </button>
            <button
              onClick={() => setSelectedCategory('standard')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                selectedCategory === 'standard' ? 'bg-[#0076B8] text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              ISO C Standard ({headers.filter((h) => h.category === 'standard').length})
            </button>
            <button
              onClick={() => setSelectedCategory('posix')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                selectedCategory === 'posix' ? 'bg-[#0076B8] text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              POSIX / Linux ({headers.filter((h) => h.category === 'posix').length})
            </button>
          </div>
        </div>

        {/* Modal Main Content: 2-Column Explorer */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Column: List of Headers */}
          <div className={`w-72 border-r overflow-y-auto p-2 space-y-1 shrink-0 ${isDark ? 'bg-[#080c14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
            {isLoading ? (
              <div className="p-4 text-center text-xs text-zinc-400">Loading headers from GCC...</div>
            ) : filteredHeaders.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400">No matching headers found.</div>
            ) : (
              filteredHeaders.map((header) => {
                const isSelected = selectedHeader?.name === header.name;
                return (
                  <button
                    key={header.name}
                    onClick={() => setSelectedHeader(header)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#0076B8] text-white font-medium shadow-xs'
                        : isDark
                        ? 'hover:bg-[#1e293b] text-[#cbd5e1]'
                        : 'hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className={`font-mono text-xs ${isSelected ? 'text-white' : 'text-[#38bdf8]'}`}>
                        &lt;{header.name}&gt;
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                          header.category === 'standard'
                            ? isSelected ? 'bg-white/20 text-white' : 'bg-sky-950/60 text-sky-400 border border-sky-800/40'
                            : isSelected ? 'bg-white/20 text-white' : 'bg-purple-950/60 text-purple-400 border border-purple-800/40'
                        }`}
                      >
                        {header.category === 'standard' ? 'ISO C' : 'POSIX'}
                      </span>
                      {header.available && (
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#38bdf8]'}`} />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Selected Header Details */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedHeader ? (
              <div className="space-y-6">
                {/* Header Title Card */}
                <div className={`p-4 rounded-xl border flex items-start justify-between ${isDark ? 'bg-[#0b0f17] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <h4 className="text-lg font-mono font-bold text-[#38bdf8]">
                        #include &lt;{selectedHeader.name}&gt;
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                          selectedHeader.category === 'standard'
                            ? 'bg-sky-950/80 text-sky-300 border border-sky-800/60'
                            : 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                        }`}
                      >
                        {selectedHeader.category === 'standard' ? 'ISO C Standard' : 'POSIX API'}
                      </span>
                      {selectedHeader.available ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#38bdf8] font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Compiler Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-mono">
                          <AlertCircle className="w-3.5 h-3.5" /> Unavailable
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                      {selectedHeader.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopyInclude(selectedHeader.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                        copiedHeader === selectedHeader.name
                          ? 'bg-[#0076B8] text-white border-[#0076B8]'
                          : isDark
                          ? 'bg-[#1e293b] hover:bg-[#334155] text-white border-[#334155]'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      {copiedHeader === selectedHeader.name ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedHeader === selectedHeader.name ? 'Copied' : 'Copy'}</span>
                    </button>

                    {onInsertHeader && (
                      <button
                        onClick={() => {
                          onInsertHeader(selectedHeader.name);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-[#0076B8] hover:bg-[#0088d4] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Insert in Code</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Common Functions & Macros */}
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
                    Common Functions, Types & Constants
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {selectedHeader.commonFunctions.map((fn) => (
                      <div
                        key={fn}
                        className={`px-2.5 py-1.5 rounded-lg border font-mono text-xs flex items-center justify-between ${
                          isDark ? 'bg-[#0b0f17] border-[#1e293b] text-sky-300' : 'bg-slate-50 border-slate-200 text-sky-700'
                        }`}
                      >
                        <span>{fn}</span>
                        <span className="text-[10px] text-zinc-500 font-sans">symbol</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compiler Linker Requirements */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0b0f17]/60 border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                  <h5 className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#38bdf8]" /> Compiler & Linker Configuration
                  </h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {selectedHeader.name === 'math.h'
                      ? 'CodeForge automatically passes the -lm flag to GCC when compiling programs including math.h.'
                      : selectedHeader.name === 'pthread.h'
                      ? 'CodeForge automatically passes the -pthread flag to GCC for multi-threaded compilation.'
                      : 'Included in the GCC C standard toolchain; compiled automatically under ISO C17 (default), C11, or C23.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                Select a header from the list to view specifications
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-3.5 border-t flex items-center justify-between text-xs shrink-0 ${isDark ? 'bg-[#0b0f17] border-[#1e293b] text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
          <div className="flex items-center space-x-2">
            <span>GCC Standards:</span>
            <span className="font-mono text-[#38bdf8] font-semibold">C17 (Default)</span>
            <span>•</span>
            <span className="font-mono text-sky-400">C11</span>
            <span>•</span>
            <span className="font-mono text-purple-400">C23</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-white rounded-lg text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
