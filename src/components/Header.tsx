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
  Compass
} from 'lucide-react';

interface HeaderProps {
  state: SvpwmState;
  onUpdateState: (partial: Partial<SvpwmState>) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  onUpdateState,
  activeTab,
  setActiveTab,
  onReset,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white shadow-xs sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-linear-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Space Vector Modulation
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  Teaching Demonstration Lab
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Power Electronics Interactive Lab • Rotating Field Theory • 2-to-6 Level SVPWM Dynamics
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start lg:self-auto">
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'visualizer'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-sky-600" />
              <span>Interactive Lab</span>
            </button>
            <button
              onClick={() => setActiveTab('rotating-field')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'rotating-field'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-blue-600" />
              <span>Rotating Vector</span>
            </button>
            <button
              onClick={() => setActiveTab('dwell')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'dwell'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 text-indigo-600" />
              <span>Dwell Times Bar</span>
            </button>
            <button
              onClick={() => setActiveTab('multilevel')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'multilevel'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Network className="h-3.5 w-3.5 text-emerald-600" />
              <span>Multilevel SVM</span>
            </button>
            <button
              onClick={() => setActiveTab('equations')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'equations'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Binary className="h-3.5 w-3.5 text-violet-600" />
              <span>Live Derivations</span>
            </button>
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'curriculum'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-600" />
              <span>Guided Course</span>
            </button>
          </div>

          {/* Quick Global Action Controls */}
          <div className="flex items-center gap-2">
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
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

