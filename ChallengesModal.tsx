import React, { useState, useEffect } from 'react';
import {
  Trophy,
  X,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Code2,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CodingChallenge } from '../../shared/types.ts';
import { getChallenges, runChallengeTests } from '../services/apiService.ts';
import { recordChallengeCompleted } from '../services/storageService.ts';

interface ChallengesModalProps {
  currentCode: string;
  onLoadChallengeCode: (starterCode: string, challengeTitle: string) => void;
  onClose: () => void;
  isDark: boolean;
}

export const ChallengesModal: React.FC<ChallengesModalProps> = ({
  currentCode,
  onLoadChallengeCode,
  onClose,
  isDark,
}) => {
  const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('sum-two-numbers');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    passed: boolean;
    totalPassed: number;
    totalTests: number;
    compileError?: string;
    results: any[];
  } | null>(null);

  useEffect(() => {
    getChallenges().then((data) => {
      setChallenges(data);
      if (data.length > 0) setSelectedChallengeId(data[0].id);
    });
  }, []);

  const selectedChallenge = challenges.find((c) => c.id === selectedChallengeId) || challenges[0];

  const handleRunTests = async () => {
    if (!selectedChallenge) return;
    setIsTesting(true);
    setTestResults(null);

    try {
      const response = await runChallengeTests(selectedChallenge.id, currentCode);
      setTestResults(response);

      if (response.passed) {
        recordChallengeCompleted(selectedChallenge.id);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      setTestResults({
        passed: false,
        totalPassed: 0,
        totalTests: 0,
        compileError: err.message,
        results: [],
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="challenges-modal-container"
        className={`w-full max-w-5xl h-[85vh] rounded-xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-[#18181b] border-[#27272a] text-[#e4e4e7]' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-[#141416] border-[#27272a]' : 'bg-slate-50 border-zinc-200'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#0076B8]/15 border border-[#0076B8]/40 flex items-center justify-center text-[#38bdf8]">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">C Coding Challenges</h2>
              <p className="text-xs text-zinc-400">Solve real systems & algorithmic problems with automated tests</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-500/15 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Body */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Column: Challenge List */}
          <div className={`w-72 border-r overflow-y-auto p-2 space-y-1 ${isDark ? 'border-[#27272a] bg-[#141416]' : 'border-zinc-200 bg-slate-50'}`}>
            <div className="px-2 py-1 text-[10px] uppercase font-semibold text-zinc-400">Problems</div>
            {challenges.map((ch) => {
              const isSelected = ch.id === selectedChallengeId;
              return (
                <div
                  key={ch.id}
                  onClick={() => {
                    setSelectedChallengeId(ch.id);
                    setTestResults(null);
                  }}
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
                  <div className="font-semibold text-xs leading-snug">{ch.title}</div>
                  <div className="flex items-center gap-2 mt-1 text-[10px]">
                    <span className="text-zinc-400">{ch.category}</span>
                    <span>•</span>
                    <span
                      className={`font-mono font-bold ${
                        ch.difficulty === 'Easy'
                          ? 'text-[#38bdf8]'
                          : ch.difficulty === 'Medium'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {ch.difficulty}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Challenge Details & Test Runner */}
          {selectedChallenge ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 select-text">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                      selectedChallenge.difficulty === 'Easy'
                        ? 'bg-[#0076B8]/20 text-[#38bdf8] border border-[#0076B8]/40'
                        : selectedChallenge.difficulty === 'Medium'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {selectedChallenge.difficulty} • {selectedChallenge.category}
                  </span>
                  <h3 className="text-xl font-bold mt-2">{selectedChallenge.title}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{selectedChallenge.description}</p>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    id="btn-load-starter-code"
                    onClick={() => {
                      onLoadChallengeCode(selectedChallenge.starterCode, selectedChallenge.title);
                      onClose();
                    }}
                    className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5" /> Load Starter
                  </button>

                  <button
                    id="btn-evaluate-challenge"
                    onClick={handleRunTests}
                    disabled={isTesting}
                    className="px-4 py-2 bg-[#0076B8] hover:bg-[#0088d4] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    {isTesting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-white" />
                    )}
                    <span>{isTesting ? 'Evaluating...' : 'Run Test Cases'}</span>
                  </button>
                </div>
              </div>

              {/* Starter Code Preview */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Starter Template
                </div>
                <div className="p-3 rounded-xl bg-black/70 border border-current/10 overflow-x-auto text-[#38bdf8] font-mono text-xs leading-relaxed max-h-48">
                  <pre>{selectedChallenge.starterCode}</pre>
                </div>
              </div>

              {/* Test Results Output */}
              {testResults && (
                <div className="space-y-3 p-4 rounded-xl border border-current/10 bg-zinc-500/5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      {testResults.passed ? (
                        <span className="flex items-center text-[#38bdf8] gap-1.5">
                          <CheckCircle2 className="w-5 h-5" /> All Tests Passed!
                        </span>
                      ) : (
                        <span className="flex items-center text-rose-400 gap-1.5">
                          <XCircle className="w-5 h-5" /> Some Tests Failed
                        </span>
                      )}
                    </h4>

                    <span className="text-xs font-mono font-bold">
                      {testResults.totalPassed} / {testResults.totalTests} Passed
                    </span>
                  </div>

                  {testResults.compileError && (
                    <div className="p-3 rounded bg-rose-950/30 border border-rose-800/40 text-rose-300 font-mono text-xs whitespace-pre-wrap">
                      {testResults.compileError}
                    </div>
                  )}

                  <div className="space-y-2">
                    {testResults.results.map((r: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs font-mono ${
                          r.passed
                            ? 'bg-[#0076B8]/15 border-[#0076B8]/40 text-[#38bdf8]'
                            : 'bg-rose-950/20 border-rose-800/30 text-rose-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span className="flex items-center gap-1.5">
                            {r.passed ? <Check className="w-3.5 h-3.5 text-[#38bdf8]" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                            Test #{idx + 1}: {r.description}
                          </span>
                          {r.executionTime && <span>{r.executionTime} ms</span>}
                        </div>

                        {!r.passed && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-current/10 text-[11px]">
                            <div>
                              <span className="text-zinc-400">Expected:</span>
                              <div className="p-1.5 bg-black/40 rounded mt-0.5 text-[#38bdf8] whitespace-pre-wrap">
                                {r.expected}
                              </div>
                            </div>
                            <div>
                              <span className="text-zinc-400">Your Output:</span>
                              <div className="p-1.5 bg-black/40 rounded mt-0.5 text-rose-400 whitespace-pre-wrap">
                                {r.actual || r.error || '(no output)'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              Loading challenges...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
