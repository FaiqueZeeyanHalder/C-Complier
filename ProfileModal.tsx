import React from 'react';
import { User, X, Trophy, Code2, Play, Flame, Award, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../../shared/types.ts';

interface ProfileModalProps {
  profile: UserProfile;
  totalProjects: number;
  onClose: () => void;
  isDark: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  totalProjects,
  onClose,
  isDark,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="profile-modal-container"
        className={`w-full max-w-md rounded-xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-[#18181b] border-[#27272a] text-[#e4e4e7]' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-[#141416] border-[#27272a]' : 'bg-slate-50 border-zinc-200'}`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0076B8]/15 border border-[#0076B8]/40 flex items-center justify-center text-[#38bdf8]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{profile.username}</h3>
              <p className="text-[11px] text-zinc-400">Systems & C Developer Stats</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-500/15 text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center gap-2 text-[#38bdf8] mb-1">
                <Play className="w-4 h-4" />
                <span className="font-bold text-base font-mono">{profile.stats.totalRuns}</span>
              </div>
              <span className="text-[11px] text-zinc-400">Programs Executed</span>
            </div>

            <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="font-bold text-base font-mono">{profile.stats.challengesSolved.length}</span>
              </div>
              <span className="text-[11px] text-zinc-400">Challenges Solved</span>
            </div>

            <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center gap-2 text-[#38bdf8] mb-1">
                <Code2 className="w-4 h-4" />
                <span className="font-bold text-base font-mono">{totalProjects}</span>
              </div>
              <span className="text-[11px] text-zinc-400">Saved C Projects</span>
            </div>

            <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center gap-2 text-rose-400 mb-1">
                <Flame className="w-4 h-4" />
                <span className="font-bold text-base font-mono">GCC 12</span>
              </div>
              <span className="text-[11px] text-zinc-400">Target Toolchain</span>
            </div>
          </div>

          {/* Badges / Accomplishments */}
          <div>
            <div className="text-[11px] uppercase font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Earned Badges
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-2 rounded bg-[#0076B8]/15 border border-[#0076B8]/30 text-[#38bdf8]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#38bdf8]" />
                  <div>
                    <div className="font-semibold text-xs">C Compiler Master</div>
                    <div className="text-[10px] text-[#38bdf8]/80">Compiled and ran C code via GCC</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold">UNLOCKED</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#0076B8]/10 border border-[#0076B8]/25 text-[#38bdf8]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#38bdf8]" />
                  <div>
                    <div className="font-semibold text-xs">Memory Explorer</div>
                    <div className="text-[10px] text-[#38bdf8]/80">Local persistent IndexedDB workspace active</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold">UNLOCKED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
