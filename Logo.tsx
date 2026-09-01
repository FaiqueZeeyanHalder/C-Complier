import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'compact' | 'full' | 'icon-only';
  showSubtitle?: boolean;
  className?: string;
  isDark?: boolean;
}

export const FlameIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Codeforge Flame Logo"
    >
      <defs>
        <linearGradient id="flameGrad" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff4d4d" />
          <stop offset="45%" stopColor="#ef3340" />
          <stop offset="100%" stopColor="#d91424" />
        </linearGradient>
        <linearGradient id="flameHighlight" x1="60" y1="20" x2="75" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
        </linearGradient>
        <filter id="flameGlow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#ef3340" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Main Stylized Flame Silhouette */}
      <g filter="url(#flameGlow)">
        <path
          d="M 50 12 
             C 54 22, 63 30, 72 40 
             C 79 48, 81 58, 77 69 
             C 73 78, 65 85, 50 85 
             C 55 79, 56 72, 50 67 
             C 44 72, 45 79, 50 85 
             C 35 85, 27 78, 23 69 
             C 19 58, 21 48, 28 40 
             C 37 30, 46 22, 50 12 Z"
          fill="url(#flameGrad)"
        />
        {/* Left flame curl lobe */}
        <path
          d="M 28 40 
             C 20 48, 17 58, 22 69 
             C 25 76, 31 81, 38 84 
             C 30 81, 26 73, 26 65 
             C 26 55, 31 48, 38 43 
             C 34 42, 30 41, 28 40 Z"
          fill="#ff4d4d"
          fillOpacity="0.9"
        />
        {/* Inner Curved Highlight Shine */}
        <path
          d="M 64 36 
             C 72 44, 75 52, 73 62 
             C 71 54, 66 46, 59 40 
             C 61 38, 63 37, 64 36 Z"
          fill="url(#flameHighlight)"
        />
      </g>
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'compact',
  showSubtitle = true,
  className = '',
  isDark = true,
}) => {
  const iconSize = size === 'sm' ? 22 : size === 'md' ? 28 : size === 'lg' ? 44 : 64;

  if (variant === 'icon-only') {
    return <FlameIcon size={iconSize} className={className} />;
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center select-none text-center ${className}`}>
        <FlameIcon size={iconSize} className="mb-2" />
        <h1
          className={`font-extrabold tracking-tight leading-tight ${
            size === 'lg' ? 'text-2xl' : size === 'xl' ? 'text-4xl' : 'text-xl'
          } ${isDark ? 'text-white' : 'text-slate-900'}`}
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
        >
          Codeforge
        </h1>
        {showSubtitle && (
          <p
            className="text-[10px] tracking-[0.2em] font-mono uppercase font-semibold mt-1 text-[#0076B8]"
          >
            C IDE & Cloud Sandbox
          </p>
        )}
      </div>
    );
  }

  // Compact variant (For top navigation bar & modal headers)
  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      <FlameIcon size={iconSize} />
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-bold tracking-tight ${
              size === 'sm' ? 'text-xs' : 'text-sm'
            } ${isDark ? 'text-white' : 'text-slate-900'}`}
          >
            Codeforge
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[8px] font-mono uppercase tracking-wider text-[#94a3b8] mt-0.5 font-medium">
            C Cloud IDE
          </span>
        )}
      </div>
    </div>
  );
};
