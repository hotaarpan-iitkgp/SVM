/**
 * Space Vector Modulation (SVPWM) Interactive Teaching Demonstration.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SvpwmState, ModulationMode, ActiveTab } from './types';
import { 
  calculateSvpwm, 
  getInstantaneousSwitchBits, 
  bitsToVectorId,
  getSvpwm7Segments
} from './utils/svpwm';
import { Header } from './components/Header';
import { HexagonView } from './components/HexagonView';
import { PwmSequenceView } from './components/PwmSequenceView';
import { InverterCircuitView } from './components/InverterCircuitView';
import { WaveformsView } from './components/WaveformsView';
import { HarmonicsView } from './components/HarmonicsView';
import { FormulaInspector } from './components/FormulaInspector';
import { CurriculumGuide } from './components/CurriculumGuide';
import { DwellTimesView } from './components/DwellTimesView';
import { MultilevelSvmView } from './components/MultilevelSvmView';
import { RotatingVectorView } from './components/RotatingVectorView';
import { Sliders, RotateCcw, Info, Zap, ChevronLeft, ChevronRight, Gauge } from 'lucide-react';

const INITIAL_STATE: SvpwmState = {
  vdc: 400,
  f0: 50,
  fsw: 2500,
  m: 0.85,
  mode: 'svpwm',
  theta: Math.PI / 6, // 30 degrees (Sector 1)
  thetaDeg: 30,
  isPlaying: true,
  speed: 0.03, // constrained between 0.01x and 0.10x
  sector: 1,
  vAlpha: 0,
  vBeta: 0,
  vRefMag: 0,
  ts: 1 / 2500,
  t1: 0,
  t2: 0,
  t0: 0,
  t000: 0,
  t111: 0,
  da: 0.5,
  db: 0.5,
  dc: 0.5,
  subCycleProgress: 0.25,
  activeVectorId: 1,
  activeBits: [1, 0, 0],
};

export default function App() {
  const [state, setState] = useState<SvpwmState>(() => {
    const computed = calculateSvpwm(
      INITIAL_STATE.theta,
      INITIAL_STATE.m,
      INITIAL_STATE.vdc,
      INITIAL_STATE.fsw
    );
    const bits = getInstantaneousSwitchBits(computed.da, computed.db, computed.dc, 0.25);
    return {
      ...INITIAL_STATE,
      ...computed,
      activeVectorId: bitsToVectorId(bits),
      activeBits: bits,
    };
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('visualizer');
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('svpwm_theme');
    if (saved) return saved === 'dark';
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('svpwm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('svpwm_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Update partial state and recompute instantaneous values
  const handleUpdateState = useCallback((partial: Partial<SvpwmState>) => {
    setState((prev) => {
      const next = { ...prev, ...partial };

      // Sync theta and thetaDeg if one of them is updated
      if (partial.theta !== undefined && partial.thetaDeg === undefined) {
        let norm = partial.theta % (2 * Math.PI);
        if (norm < 0) norm += 2 * Math.PI;
        next.theta = norm;
        next.thetaDeg = Math.round((norm * 180) / Math.PI);
      } else if (partial.thetaDeg !== undefined && partial.theta === undefined) {
        let deg = partial.thetaDeg % 360;
        if (deg < 0) deg += 360;
        next.thetaDeg = deg;
        next.theta = (deg * Math.PI) / 180;
      }

      // Recompute SVPWM math
      const computed = calculateSvpwm(next.theta, next.m, next.vdc, next.fsw);
      const subProg = next.subCycleProgress ?? prev.subCycleProgress;

      // Unify active segment, bits, and vector id with the 7-segment sequence
      const segments = getSvpwm7Segments(computed.sector, computed.t1, computed.t2, computed.t0, computed.ts);
      let activeSeg = segments[0];
      for (const s of segments) {
        if (subProg >= s.tStart && subProg < s.tEnd) {
          activeSeg = s;
          break;
        }
      }
      if (subProg >= segments[segments.length - 1].tStart) {
        activeSeg = segments[segments.length - 1];
      }

      return {
        ...next,
        ...computed,
        activeVectorId: activeSeg.id,
        activeBits: activeSeg.bits,
      };
    });
  }, []);

  // Animation frame loop
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const loop = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const dt = (timestamp - lastTimeRef.current) / 1000; // in seconds
      lastTimeRef.current = timestamp;

      setState((prev) => {
        if (!prev.isPlaying) return prev;

        // Advance theta smoothly at scaled teaching frequency:
        // prev.speed (0.01x .. 0.10x) maps to 0.10 rev/s (10s/cycle) to 1.0 rev/s (1s/cycle)
        const dTheta = 2 * Math.PI * 10 * dt * prev.speed;
        let newTheta = (prev.theta + dTheta) % (2 * Math.PI);
        if (newTheta < 0) newTheta += 2 * Math.PI;
        const newThetaDeg = Math.round((newTheta * 180) / Math.PI);

        // Advance subCycleProgress within Ts
        const dSub = (dt * prev.fsw * prev.speed * 0.25) % 1;
        const newSub = (prev.subCycleProgress + dSub) % 1;

        const computed = calculateSvpwm(newTheta, prev.m, prev.vdc, prev.fsw);
        const segments = getSvpwm7Segments(computed.sector, computed.t1, computed.t2, computed.t0, computed.ts);
        let activeSeg = segments[0];
        for (const s of segments) {
          if (newSub >= s.tStart && newSub < s.tEnd) {
            activeSeg = s;
            break;
          }
        }
        if (newSub >= segments[segments.length - 1].tStart) {
          activeSeg = segments[segments.length - 1];
        }

        return {
          ...prev,
          theta: newTheta,
          thetaDeg: newThetaDeg,
          subCycleProgress: newSub,
          ...computed,
          activeVectorId: activeSeg.id,
          activeBits: activeSeg.bits,
        };
      });

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, []);

  const handleReset = () => {
    handleUpdateState(INITIAL_STATE);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 transition-colors duration-200">
      {/* Top Header */}
      <Header
        state={state}
        onUpdateState={handleUpdateState}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReset={handleReset}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Tab 1: Interactive Laboratory */}
        {activeTab === 'visualizer' && (
          <div className="space-y-6">
            {/* Top Parameters Quick Adjustment Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs transition-colors">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">DC Bus Vdc:</span>
                  <select
                    value={state.vdc}
                    onChange={(e) => handleUpdateState({ vdc: Number(e.target.value) })}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 font-mono font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value={200}>200 V (LV)</option>
                    <option value={400}>400 V (Standard)</option>
                    <option value={600}>600 V (EV)</option>
                    <option value={800}>800 V (Ultra EV)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Fund. Freq (f0):</span>
                  <select
                    value={state.f0}
                    onChange={(e) => handleUpdateState({ f0: Number(e.target.value) })}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 font-mono font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value={25}>25 Hz (Low speed)</option>
                    <option value={50}>50 Hz (EU grid)</option>
                    <option value={60}>60 Hz (US grid)</option>
                    <option value={100}>100 Hz (High speed)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Switching Freq (fsw):</span>
                  <select
                    value={state.fsw}
                    onChange={(e) => handleUpdateState({ fsw: Number(e.target.value) })}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 font-mono font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value={1000}>1.0 kHz (Audible)</option>
                    <option value={2500}>2.5 kHz (Nominal)</option>
                    <option value={5000}>5.0 kHz (Medium)</option>
                    <option value={10000}>10.0 kHz (SiC/GaN)</option>
                  </select>
                </div>
              </div>

              {/* Simulation Speed & Step Controls */}
              <div className="flex items-center gap-3">
                {/* Step controls */}
                <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2">
                  <button
                    onClick={() => {
                      const newDeg = (state.thetaDeg - 5 + 360) % 360;
                      handleUpdateState({ thetaDeg: newDeg, isPlaying: false });
                    }}
                    title="Step backward 5 degrees"
                    className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 px-1">
                    {Math.round(state.thetaDeg)}°
                  </span>
                  <button
                    onClick={() => {
                      const newDeg = (state.thetaDeg + 5) % 360;
                      handleUpdateState({ thetaDeg: newDeg, isPlaying: false });
                    }}
                    title="Step forward 5 degrees"
                    className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Speed Slider: strictly 0.01x to 0.10x */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Gauge className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    Speed:
                  </span>
                  <input
                    type="range"
                    min="0.01"
                    max="0.10"
                    step="0.005"
                    value={state.speed}
                    onChange={(e) => handleUpdateState({ speed: Number(e.target.value) })}
                    className="w-24 accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  >
                  </input>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-bold w-12 text-right">
                    {state.speed.toFixed(2)}x
                  </span>
                </div>
              </div>
            </div>

            {/* Core Dual-Column Laboratory Display */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
              {/* Left Column: Complex Hexagon */}
              <div className="flex flex-col h-full min-h-[500px]">
                <HexagonView state={state} onUpdateState={handleUpdateState} darkMode={darkMode} />
              </div>

              {/* Right Column: Symmetrical 7-Segment PWM Sub-Cycle Timing */}
              <div className="flex flex-col h-full min-h-[500px]">
                <PwmSequenceView state={state} onUpdateState={handleUpdateState} darkMode={darkMode} />
              </div>
            </div>

            {/* Second Row: Inverter Circuit Live Conduction & Harmonic Spectrum */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
              {/* Left: 3-Phase Inverter Live Conduction Schematic */}
              <div className="flex flex-col h-full min-h-[460px]">
                <InverterCircuitView state={state} darkMode={darkMode} />
              </div>

              {/* Right: Harmonic Spectrum (FFT) & DC Bus Utilization */}
              <div className="flex flex-col h-full min-h-[460px]">
                <HarmonicsView state={state} darkMode={darkMode} />
              </div>
            </div>

            {/* Third Row: Full-Cycle Waveforms (Saddle Wave, PWM Pulses, Filtered AC) */}
            <div className="w-full">
              <WaveformsView state={state} onUpdateState={handleUpdateState} darkMode={darkMode} />
            </div>
          </div>
        )}

        {/* Tab 2: Rotating Vector Formation (Space and Phase shifted vectors) */}
        {activeTab === 'rotating-field' && (
          <div className="py-2">
            <RotatingVectorView state={state} onUpdateState={handleUpdateState} darkMode={darkMode} />
          </div>
        )}

        {/* Tab 3: Dwell Times Bar & Volt-Second Balance */}
        {activeTab === 'dwell' && (
          <div className="py-2">
            <DwellTimesView state={state} onUpdateState={handleUpdateState} darkMode={darkMode} />
          </div>
        )}

        {/* Tab 3: Multilevel Space Vector Modulation (3-Level NPC) */}
        {activeTab === 'multilevel' && (
          <div className="py-2">
            <MultilevelSvmView state={state} onUpdateState={handleUpdateState} darkMode={darkMode} />
          </div>
        )}

        {/* Tab 4: Live Derivations & Calculations */}
        {activeTab === 'equations' && (
          <div className="py-2 max-w-5xl mx-auto">
            <FormulaInspector state={state} />
          </div>
        )}

        {/* Tab 5: Guided Curriculum Course (8 Steps) */}
        {activeTab === 'curriculum' && (
          <div className="py-2">
            <CurriculumGuide
              state={state}
              onUpdateState={handleUpdateState}
              onGoToVisualizer={() => setActiveTab('visualizer')}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Space Vector Modulation (SVPWM) Interactive Teaching & Demonstration Lab</span>
          <span className="text-slate-400 dark:text-slate-500">
            Three-Phase VSI • Clarke Transformation • Center-Aligned 7-Segment PWM • Min-Max Saddle Wave
          </span>
        </div>
      </footer>
    </div>
  );
}
