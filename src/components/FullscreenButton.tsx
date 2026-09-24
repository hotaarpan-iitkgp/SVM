import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onToggle: () => void;
  className?: string;
  label?: string;
}

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({
  isFullscreen,
  onToggle,
  className = '',
  label,
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold select-none cursor-pointer ${className}`}
      title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen'}
      aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
    >
      {isFullscreen ? (
        <>
          <Minimize2 className="h-3.5 w-3.5" />
          <span>{label || 'Exit Fullscreen'}</span>
        </>
      ) : (
        <>
          <Maximize2 className="h-3.5 w-3.5" />
          <span>{label || 'Fullscreen'}</span>
        </>
      )}
    </button>
  );
};
