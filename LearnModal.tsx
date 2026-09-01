import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  X,
  Code,
  CheckCircle2,
  ChevronRight,
  Play,
  ArrowRight,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import { LearnLesson } from '../../shared/types.ts';
import { getLessons } from '../services/apiService.ts';

interface LearnModalProps {
  onLoadLessonCode: (code: string, lessonTitle: string) => void;
  onClose: () => void;
  isDark: boolean;
}

export const LearnModal: React.FC<LearnModalProps> = ({ onLoadLessonCode, onClose, isDark }) => {
  const [lessons, setLessons] = useState<LearnLesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('intro-c');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLessons()
      .then((data) => {
        setLessons(data);
        if (data.length > 0) setSelectedLessonId(data[0].id);
      })
      .catch((err) => console.error('Failed to load lessons:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const selectedLesson = lessons.find((l) => l.id === selectedLessonId) || lessons[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="learn-modal-container"
        className={`w-full max-w-5xl h-[85vh] rounded-xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-[#18181b] border-[#27272a] text-[#e4e4e7]' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-[#141416] border-[#27272a]' : 'bg-slate-50 border-zinc-200'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#0076B8]/15 border border-[#0076B8]/40 flex items-center justify-center text-[#38bdf8]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Interactive C Curriculum</h2>
              <p className="text-xs text-zinc-400">From pointers and memory to data structures & algorithms</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-500/15 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Body: Navigation & Lesson Viewer */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Column: Lessons Navigation */}
          <div className={`w-72 border-r overflow-y-auto p-2 space-y-1 ${isDark ? 'border-[#27272a] bg-[#141416]' : 'border-zinc-200 bg-slate-50'}`}>
            <div className="px-2 py-1 text-[10px] uppercase font-semibold text-zinc-400">Modules</div>
            {lessons.map((lesson) => {
              const isSelected = lesson.id === selectedLessonId;
              return (
                <div
                  key={lesson.id}
                  onClick={() => setSelectedLessonId(lesson.id)}
                  className={`p-2.5 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-[#0076B8]/20 border border-[#0076B8]/50 text-[#38bdf8]'
                        : 'bg-[#0076B8]/10 border border-[#0076B8]/40 text-[#0076B8]'
                      : isDark
                      ? 'hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                      : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <div className="font-semibold text-xs leading-snug">{lesson.title}</div>
                  <div className="flex items-center gap-2 mt-1 text-[10px]">
                    <span className="text-zinc-400">{lesson.category}</span>
                    <span>•</span>
                    <span className={`font-mono ${lesson.difficulty === 'Beginner' ? 'text-[#38bdf8]' : lesson.difficulty === 'Intermediate' ? 'text-amber-400' : 'text-rose-400'}`}>
                      {lesson.difficulty}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Lesson Content */}
          {selectedLesson ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 select-text">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#0076B8]/20 text-[#38bdf8] border border-[#0076B8]/40 font-mono">
                    {selectedLesson.category} • {selectedLesson.difficulty}
                  </span>
                  <h3 className="text-xl font-bold mt-2">{selectedLesson.title}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{selectedLesson.summary}</p>
                </div>

                <button
                  id="btn-load-lesson-code"
                  onClick={() => {
                    onLoadLessonCode(selectedLesson.codeSnippet, selectedLesson.title);
                    onClose();
                  }}
                  className="px-4 py-2 bg-[#0076B8] hover:bg-[#0088d4] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Open in Editor
                </button>
              </div>

              {/* Lesson Text */}
              <div className="p-4 rounded-xl border border-current/10 bg-zinc-500/5 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                {selectedLesson.content}
              </div>

              {/* Runnable Code Snippet Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <Code className="w-3.5 h-3.5" /> Interactive Example
                  </span>
                  <span className="text-[11px] text-[#38bdf8] font-mono">Ready to compile with GCC</span>
                </div>
                <div className="p-4 rounded-xl bg-black/70 border border-current/10 overflow-x-auto text-[#38bdf8] font-mono text-xs leading-relaxed">
                  <pre>{selectedLesson.codeSnippet}</pre>
                </div>
              </div>

              {/* Hints / Tips */}
              {selectedLesson.hints.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" /> Pro Tips:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90 pl-1">
                    {selectedLesson.hints.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              Loading curriculum...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
