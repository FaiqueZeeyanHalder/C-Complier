import React, { useRef, useEffect } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { X, Plus, FileCode, Circle } from 'lucide-react';
import { CProject, CProjectFile, EditorSettings, ProblemItem } from '../../shared/types.ts';

interface EditorAreaProps {
  project: CProject;
  activeFile: CProjectFile | undefined;
  unsavedFiles: Set<string>;
  onContentChange: (newContent: string) => void;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  onNewFile: () => void;
  onRun: () => void;
  onSave: () => void;
  settings: EditorSettings;
  problems: ProblemItem[];
  highlightLine?: { file?: string; line?: number } | null;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  project,
  activeFile,
  unsavedFiles,
  onContentChange,
  onSelectTab,
  onCloseTab,
  onNewFile,
  onRun,
  onSave,
  settings,
  problems,
  highlightLine,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const isDark = settings.theme === 'vs-dark';

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register Keyboard Shortcut: Ctrl+Enter / Cmd+Enter = Run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun();
    });

    // Register Keyboard Shortcut: Ctrl+S / Cmd+S = Save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    // Register high-utility C auto-completions
    monaco.languages.registerCompletionItemProvider('c', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const lineContent = model.getLineContent(position.lineNumber);
        const textUntilPosition = lineContent.substring(0, position.column - 1);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const standardHeaders = [
          { name: 'stdio.h', desc: 'Standard I/O operations (printf, scanf, fopen, fgets, fread, fwrite)' },
          { name: 'stdlib.h', desc: 'General utilities, memory allocation (malloc, free, exit, rand, qsort, atoi)' },
          { name: 'string.h', desc: 'String & byte manipulation (strlen, strcpy, strcmp, strcat, memcpy, memset)' },
          { name: 'math.h', desc: 'Mathematical functions (sqrt, pow, sin, cos, tan, log, exp, ceil, floor)' },
          { name: 'ctype.h', desc: 'Character classification & case mapping (isalpha, isdigit, isspace, tolower, toupper)' },
          { name: 'time.h', desc: 'Date and time utilities (time, clock, difftime, strftime, localtime, gmtime)' },
          { name: 'stdbool.h', desc: 'Boolean type and values (bool, true, false)' },
          { name: 'stdint.h', desc: 'Exact-width integer types (int8_t, int16_t, int32_t, int64_t, uint32_t, uint64_t)' },
          { name: 'stddef.h', desc: 'Standard type definitions (size_t, ptrdiff_t, NULL, offsetof)' },
          { name: 'limits.h', desc: 'Implementation-defined integer limits (INT_MAX, INT_MIN, CHAR_BIT, LONG_MAX)' },
          { name: 'float.h', desc: 'Floating-point characteristics and limits (FLT_MAX, DBL_MAX, FLT_EPSILON)' },
          { name: 'assert.h', desc: 'Program diagnostics and condition assertion (assert macro)' },
          { name: 'errno.h', desc: 'Error number reporting and codes (errno, EDOM, ERANGE, EINVAL, ENOENT)' },
          { name: 'locale.h', desc: 'Localization and internationalization formatting (setlocale, localeconv)' },
          { name: 'signal.h', desc: 'Signal handling and software interrupts (signal, raise, SIGINT, SIGSEGV)' },
          { name: 'setjmp.h', desc: 'Non-local jumps and execution context recovery (setjmp, longjmp, jmp_buf)' },
          { name: 'stdarg.h', desc: 'Variable argument lists handling (va_list, va_start, va_arg, va_end)' },
          { name: 'inttypes.h', desc: 'Format conversion macros for integer types (PRId64, PRIu32, SCNd32)' },
          { name: 'unistd.h', desc: 'POSIX standard symbolic constants and system calls (read, write, close, fork, sleep, usleep)' },
          { name: 'sys/types.h', desc: 'POSIX system data types (pid_t, mode_t, off_t, ssize_t, uid_t)' },
          { name: 'sys/stat.h', desc: 'POSIX file status querying and creation (stat, fstat, lstat, mkdir, S_ISDIR)' },
          { name: 'pthread.h', desc: 'POSIX threads concurrency API (pthread_create, pthread_join, pthread_mutex_t)' },
          { name: 'fcntl.h', desc: 'POSIX file control options (open, creat, fcntl, O_RDONLY, O_WRONLY, O_CREAT)' },
          { name: 'dirent.h', desc: 'POSIX directory streams manipulation (opendir, readdir, closedir, struct dirent)' },
        ];

        const headerSuggestions = standardHeaders.map((h) => ({
          label: `<${h.name}>`,
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: textUntilPosition.includes('<') ? `${h.name}>` : `<${h.name}>`,
          detail: `C Header: <${h.name}>`,
          documentation: h.desc,
          range,
        }));

        // Also suggest local project headers
        const localHeaderSuggestions = project.files
          .filter((f) => f.name.endsWith('.h'))
          .map((f) => ({
            label: `"${f.name}"`,
            kind: monaco.languages.CompletionItemKind.File,
            insertText: textUntilPosition.includes('"') ? `${f.name}"` : `"${f.name}"`,
            detail: `Project Header: "${f.name}"`,
            documentation: `Local project header file "${f.name}"`,
            range,
          }));

        const codeSnippets = [
          {
            label: '#include standard header',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '#include <${1:stdio.h}>\n',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Include standard C library header',
            range,
          },
          {
            label: '#include local header',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '#include "${1:header.h}"\n',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Include project local header file',
            range,
          },
          {
            label: 'printf',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'printf("${1:%s}\\n", ${2:args});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Standard formatted print to stdout (<stdio.h>)',
            range,
          },
          {
            label: 'scanf',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'scanf("${1:%d}", &${2:var});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Standard formatted scan from stdin (<stdio.h>)',
            range,
          },
          {
            label: 'malloc',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '(${1:type} *)malloc(sizeof(${1:type}) * ${2:count});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Allocate memory block on heap (<stdlib.h>)',
            range,
          },
          {
            label: 'free',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'free(${1:ptr});\n${1:ptr} = NULL;',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Free heap memory and safely set pointer to NULL (<stdlib.h>)',
            range,
          },
          {
            label: 'main',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'int main(int argc, char *argv[]) {\n\t${1:/* code */}\n\treturn 0;\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Standard C main entry point',
            range,
          },
          {
            label: 'struct',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'typedef struct ${1:Name} {\n\t${2:int id;}\n} ${1:Name};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Typedef struct definition',
            range,
          },
          {
            label: 'for loop',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${3}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Standard index loop',
            range,
          },
        ];

        return { suggestions: [...headerSuggestions, ...localHeaderSuggestions, ...codeSnippets] };
      },
    });
  };

  // Update Monaco markers whenever problems change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !activeFile) return;

    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) return;

    const fileProblems = problems.filter((p) => !p.file || p.file === activeFile.name);

    const markers = fileProblems.map((prob) => {
      const line = prob.line || 1;
      const col = prob.column || 1;
      return {
        severity:
          prob.type === 'error' || prob.type === 'runtime'
            ? monaco.MarkerSeverity.Error
            : prob.type === 'warning'
            ? monaco.MarkerSeverity.Warning
            : monaco.MarkerSeverity.Info,
        startLineNumber: line,
        startColumn: col,
        endLineNumber: line,
        endColumn: col + 10,
        message: prob.message,
        source: 'gcc',
      };
    });

    monaco.editor.setModelMarkers(model, 'gcc-linter', markers);
  }, [problems, activeFile]);

  // Jump and reveal line when requested
  useEffect(() => {
    if (!highlightLine || !editorRef.current || !activeFile) return;
    if (highlightLine.file && highlightLine.file !== activeFile.name) return;

    if (highlightLine.line && highlightLine.line > 0) {
      editorRef.current.revealLineInCenter(highlightLine.line);
      editorRef.current.setPosition({ lineNumber: highlightLine.line, column: 1 });
      editorRef.current.focus();
    }
  }, [highlightLine, activeFile]);

  const openFiles = project.files.filter((f) => project.openFileIds.includes(f.id));

  return (
    <div id="editor-workspace-column" className="flex-1 flex flex-col min-w-0 overflow-hidden select-none bg-[#090d14]">
      {/* Tab Bar */}
      <div
        id="editor-tab-bar"
        className={`h-9 border-b flex items-center justify-between px-1 overflow-x-auto shrink-0 ${
          isDark ? 'bg-[#0b0f17] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
        }`}
      >
        <div className="flex items-center h-full space-x-0.5">
          {openFiles.map((file) => {
            const isActive = project.activeFileId === file.id;
            const isUnsaved = unsavedFiles.has(file.id);
            const isHeader = file.name.endsWith('.h');

            return (
              <div
                key={file.id}
                id={`tab-${file.id}`}
                onClick={() => onSelectTab(file.id)}
                className={`group h-full px-3 flex items-center space-x-2 border-r text-xs cursor-pointer transition-all relative ${
                  isActive
                    ? isDark
                      ? 'bg-[#090d14] text-white border-r-[#1e293b] font-medium border-t-2 border-[#0076B8]'
                      : 'bg-white text-slate-900 border-r-slate-200 font-medium'
                    : isDark
                    ? 'text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-white border-r-[#1e293b]'
                    : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 border-r-slate-200'
                }`}
              >
                <span
                  className={`font-mono text-[9px] font-bold px-1 py-0.2 rounded ${
                    isHeader ? 'bg-sky-950/60 text-sky-400 border border-sky-800/40' : 'bg-[#0076B8]/20 text-[#38bdf8] border border-[#0076B8]/40'
                  }`}
                >
                  {isHeader ? 'H' : 'C'}
                </span>

                <span className="font-mono text-xs">{file.name}</span>

                {/* Unsaved indicator or close icon */}
                <div className="flex items-center pl-1">
                  {isUnsaved ? (
                    <span
                      title="Unsaved changes"
                      className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:hidden"
                    />
                  ) : null}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(file.id);
                    }}
                    className={`p-0.5 rounded hover:bg-[#334155] text-[#94a3b8] hover:text-white transition-colors cursor-pointer ${
                      isUnsaved ? 'hidden group-hover:block' : 'opacity-60 group-hover:opacity-100'
                    }`}
                    title="Close tab"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add new file button on tab bar */}
        <button
          id="btn-tab-new-file"
          onClick={onNewFile}
          className="p-1.5 text-[#94a3b8] hover:text-white rounded hover:bg-[#1e293b] transition-colors cursor-pointer"
          title="Create new file"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Main Canvas */}
      <div className="flex-1 relative min-h-0 bg-[#080c13]">
        {activeFile ? (
          <Editor
            height="100%"
            language="c"
            theme={settings.theme}
            value={activeFile.content}
            onChange={(val) => onContentChange(val || '')}
            onMount={handleEditorDidMount}
            options={{
              fontSize: settings.fontSize,
              tabSize: settings.tabSize,
              minimap: { enabled: settings.minimap },
              wordWrap: settings.wordWrap,
              lineNumbers: settings.lineNumbers,
              lineNumbersMinChars: 4,
              cursorBlinking: settings.cursorBlinking,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontLigatures: true,
              bracketPairColorization: { enabled: true },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderWhitespace: 'selection',
              smoothScrolling: true,
              formatOnPaste: false,
              formatOnType: false,
              folding: true,
              foldingStrategy: 'auto',
              renderLineHighlight: 'all',
              maxTokenizationLineLength: 2000000,
              stopRenderingLineAfter: 1000000,
              largeFileOptimizations: true,
              unicodeHighlight: { ambiguousCharacters: false, invisibleCharacters: false },
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
              suggest: {
                showKeywords: true,
                showSnippets: true,
              },
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[#64748b] text-sm">
            <FileCode className="w-10 h-10 mb-2 text-[#334155]" />
            <p>No file open in editor</p>
            <button
              onClick={onNewFile}
              className="mt-3 px-3 py-1.5 bg-[#0076B8] hover:bg-[#0088d4] text-white rounded text-xs font-semibold cursor-pointer"
            >
              Create File
            </button>
          </div>
        )}
      </div>

      {/* Editor Status Bar */}
      {activeFile && (
        <div
          id="editor-status-bar"
          className={`h-6 px-3 border-t flex items-center justify-between text-[11px] font-mono select-none ${
            isDark ? 'bg-[#0b0f17] border-[#1e293b] text-[#64748b]' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-[#38bdf8] flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0076B8]" />
              <span>{activeFile.name}</span>
            </span>
            <span>•</span>
            <span>
              {(activeFile.content.split('\n').length).toLocaleString()} lines
            </span>
            <span>•</span>
            <span>
              {(activeFile.content.length).toLocaleString()} chars
              {activeFile.content.length > 1024
                ? ` (${(activeFile.content.length / 1024).toFixed(1)} KB)`
                : ''}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <span>Spaces: {settings.tabSize}</span>
            <span>•</span>
            <span>UTF-8</span>
            <span>•</span>
            <span className="text-sky-400 font-semibold">
              {(settings.cStandard || 'c17').toUpperCase()} (GCC)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
