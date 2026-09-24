import React, { useMemo, useState } from 'react';
import { SvpwmState } from '../types';
import { calculateHarmonicSpectrum } from '../utils/svpwm';
import { BarChart3, TrendingUp, Zap, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useCardFullscreen } from '../hooks/useCardFullscreen';
import { FullscreenButton } from './FullscreenButton';

interface HarmonicsViewProps {
  state: SvpwmState;
  darkMode?: boolean;
}

export const HarmonicsView: React.FC<HarmonicsViewProps> = ({ state, darkMode }) => {
  const [compareMode, setCompareMode] = useState<'svpwm' | 'spwm'>('svpwm');
  const { isFullscreen, toggleFullscreen, cardRef } = useCardFullscreen();

  // Compute harmonic spectra for both modes
  const svpwmData = useMemo(() => {
    return calculateHarmonicSpectrum(state.m, state.f0, state.fsw, 'svpwm');
  }, [state.m, state.f0, state.fsw]);

  const spwmData = useMemo(() => {
    return calculateHarmonicSpectrum(state.m, state.f0, state.fsw, 'spwm');
  }, [state.m, state.f0, state.fsw]);

  const currentData = compareMode === 'svpwm' ? svpwmData : spwmData;

  // Chart layout constants - enlarged
  const chartHeight = isFullscreen ? 260 : 180;
  const maxBarH = isFullscreen ? 220 : 150;

  return (
    <div
      ref={cardRef}
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-white dark:bg-slate-950 p-6 sm:p-8 flex flex-col overflow-auto shadow-2xl'
          : 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col h-full'
      } transition-colors`}
    >
      {/* Title & Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Harmonic Spectrum (FFT) & DC Bus Utilization
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              f0 = {state.f0} Hz • fsw = {state.fsw / 1000} kHz
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare harmonic distortion (THD%) and maximum fundamental AC output
          </p>
        </div>

        {/* Toggle between SVPWM and SPWM + Fullscreen */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setCompareMode('svpwm')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                compareMode === 'svpwm'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              SVPWM (Space Vector)
            </button>
            <button
              onClick={() => setCompareMode('spwm')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                compareMode === 'spwm'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              SPWM (Sinusoidal)
            </button>
          </div>

          <FullscreenButton isFullscreen={isFullscreen} onToggle={toggleFullscreen} />
        </div>
      </div>

      {/* Comparative Metrics Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3 text-xs">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
            Fundamental (1st)
          </span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {currentData.fundamentalV} V <span className="text-xs font-normal text-slate-500 dark:text-slate-400">rms/pk</span>
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            {compareMode === 'svpwm' ? '100% full capacity' : '86.6% SPWM ceiling'}
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
            DC Bus Utilization
          </span>
          <span className={`text-lg font-bold ${compareMode === 'svpwm' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
            {currentData.dcUtilizationPercent}%
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            {compareMode === 'svpwm' ? '+15.5% vs SPWM' : '15.5% unused DC link'}
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
            Total Harmonic Dist.
          </span>
          <span className={`text-lg font-bold ${
            state.m > 1.0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            THD: {currentData.thdPercent}%
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            {state.m > 1.0 ? 'Overmodulation ripple' : 'Low switching noise'}
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
            Triplen Harmonics (3rd, 9th)
          </span>
          <span className="text-lg font-bold text-sky-700 dark:text-sky-400">0.0% (Zero)</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Cancelled in 3-wire load
          </span>
        </div>
      </div>

      {/* FFT Bar Chart */}
      <div className={`relative flex-1 w-full my-3 ${isFullscreen ? 'min-h-[280px]' : 'min-h-[200px]'} flex flex-col justify-end`}>
        <div style={{ height: `${chartHeight}px` }} className="flex items-end justify-between gap-1 w-full px-2 pt-2 border-b border-slate-200 dark:border-slate-700">
          {currentData.harmonics.map((h, i) => {
            const barH = Math.max(4, (h.magnitudePercent / 100) * maxBarH);
            const isFundamental = h.order === 1;

            return (
              <div
                key={`h-${h.order}-${i}`}
                className="flex-1 flex flex-col items-center justify-end group relative h-full"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-7 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm z-20 whitespace-nowrap pointer-events-none">
                  <span>H{h.order} ({h.freqHz}Hz): {h.magnitudePercent.toFixed(1)}%</span>
                </div>

                {/* Bar */}
                <div
                  style={{ height: `${barH}px` }}
                  className={`w-full max-w-[24px] rounded-t transition-all ${
                    isFundamental
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : h.isCarrier
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                />

                {/* X Axis Order label */}
                <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 font-mono font-medium">
                  {isFundamental ? 'f0' : h.order >= 40 ? 'fsw' : `h${h.order}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 px-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block"></span>
              Fundamental (50 Hz)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>
              Low-Order (5th, 7th, 11th)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block"></span>
              Carrier Band (~{state.fsw / 1000} kHz)
            </span>
          </div>

          <span className="text-slate-400 dark:text-slate-500 italic hidden sm:inline">
            Notice: Triplen harmonics (3, 9, 15) are completely absent in line voltage!
          </span>
        </div>
      </div>
    </div>
  );
};
