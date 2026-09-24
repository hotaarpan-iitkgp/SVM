import React from 'react';
import { SvpwmState, ActiveTab } from '../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  BookOpen, 
  Binary, 
  Activity, 
  Sparkles,
  Zap,
  BarChart3,
  Network,
  Compass,
  Sun,
  Moon,
  Gauge
} from 'lucide-react';

interface HeaderProps {
  state: SvpwmState;
  onUpdateState: (partial: Partial<SvpwmState>) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onReset: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  onUpdateState,
  activeTab,
  setActiveTab,
  onReset,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-linear-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Space Vector Modulation
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Teaching Demonstration Lab
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Power Electronics Interactive Lab • Rotating Field Theory • 2-to-6 Level SVPWM Dynamics
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700/80 self-start lg:self-auto">
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'visualizer'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Interactive Lab</span>
            </button>
            <button
              onClick={() => setActiveTab('rotating-field')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'rotating-field'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Rotating Vector</span>
            </button>
            <button
              onClick={() => setActiveTab('dwell')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'dwell'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Dwell Times Bar</span>
            </button>
            <button
              onClick={() => setActiveTab('multilevel')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'multilevel'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Network className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Multilevel SVM</span>
            </button>
            <button
              onClick={() => setActiveTab('equations')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'equations'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Binary className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              <span>Live Derivations</span>
            </button>
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'curriculum'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Guided Course</span>
            </button>
          </div>

          {/* Quick Global Action Controls */}
          <div className="flex items-center gap-2">
            {/* Speed Control (0.01x - 0.10x) */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700/80 text-xs">
              <Gauge className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Speed:</span>
              <input
                type="range"
                min="0.01"
                max="0.10"
                step="0.005"
                value={state.speed}
                onChange={(e) => onUpdateState({ speed: Number(e.target.value) })}
                className="w-16 accent-sky-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
                title={`Simulation speed: ${state.speed.toFixed(2)}x (min: 0.01x, max: 0.10x)`}
              />
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] w-9 text-right">
                {state.speed.toFixed(2)}x
              </span>
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={() => onUpdateState({ isPlaying: !state.isPlaying })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white shadow-xs transition-colors ${
                state.isPlaying
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-sky-600 hover:bg-sky-700'
              }`}
            >
              {state.isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Rotate</span>
                </>
              )}
            </button>

            {/* Reset */}
            <button
              onClick={onReset}
              title="Reset parameters to nominal default"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {darkMode ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
