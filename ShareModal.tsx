import React, { useState } from 'react';
import { Share2, X, Copy, Check, Link, FileCode, CheckCircle2 } from 'lucide-react';
import { generateShareUrl } from '../services/exportService.ts';

interface ShareModalProps {
  code: string;
  stdin: string;
  projectName: string;
  onClose: () => void;
  isDark: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  code,
  stdin,
  projectName,
  onClose,
  isDark,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  const shareUrl = generateShareUrl(code, stdin);

  const markdownSnippet = `\`\`\`c
// ${projectName} - CodeForge C
${code}
\`\`\``;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownSnippet);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="share-modal-container"
        className={`w-full max-w-lg rounded-xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-[#18181b] border-[#27272a] text-[#e4e4e7]' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-[#141416] border-[#27272a]' : 'bg-slate-50 border-zinc-200'}`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0076B8]/15 border border-[#0076B8]/40 flex items-center justify-center text-[#38bdf8]">
              <Share2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Share C Program</h3>
              <p className="text-[11px] text-zinc-400">Shareable URL with embedded source and stdin</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-500/15 text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Share URL */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-[#38bdf8]" /> Shareable Web Link
            </label>
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className={`flex-1 p-2 rounded border text-xs font-mono select-all outline-none ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-zinc-100 border-zinc-300 text-zinc-800'
                }`}
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-[#0076B8] hover:bg-[#0088d4] text-white rounded font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Markdown Snippet */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-[#38bdf8]" /> Markdown Embed
            </label>
            <textarea
              readOnly
              rows={4}
              value={markdownSnippet}
              className={`w-full p-2 rounded border text-xs font-mono select-all resize-none outline-none ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-zinc-100 border-zinc-300 text-zinc-800'
              }`}
            />
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-[#38bdf8]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMarkdown ? 'Copied Markdown' : 'Copy Markdown'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
