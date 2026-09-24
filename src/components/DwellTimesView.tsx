import React, { useMemo } from 'react';
import { SvpwmState } from '../types';
import { getSvpwm7Segments, getSectorSequence } from '../utils/svpwm';
import { 
  BarChart3, 
  Layers, 
  Maximize2, 
  HelpCircle, 
  ArrowRight, 
  Compass, 
  Sliders, 
  Zap, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface DwellTimesViewProps {
  state: SvpwmState;
  onUpdateState: (partial: Partial<SvpwmState>) => void;
}

export const DwellTimesView: React.FC<DwellTimesViewProps> = ({ state, onUpdateState }) => {
  const { theta, thetaDeg, m, vdc, fsw, ts, t1, t2, t0, sector } = state;

  // Segments for current sector
  const segments = useMemo(() => {
    return getSvpwm7Segments(sector, t1, t2, t0, ts);
  }, [sector, t1, t2, t0, ts]);

  // Compute 360-degree continuous curves for T1, T2, T0 across all angles
  const dwellCurves = useMemo(() => {
    const points = [];
    const steps = 180;
    for (let i = 0; i <= steps; i++) {
      const deg = (i / steps) * 360;
      const rad = (deg * Math.PI) / 180;
      const sec = Math.min(6, Math.floor(deg / 60) + 1);
      const alpha = rad - (sec - 1) * (Math.PI / 3);

      let curT1 = m * ts * Math.sin(Math.PI / 3 - alpha);
      let curT2 = m * ts * Math.sin(alpha);
      if (curT1 + curT2 > ts) {
        const sc = ts / (curT1 + curT2);
        curT1 *= sc;
        curT2 *= sc;
      }
      const curT0 = Math.max(0, ts - curT1 - curT2);

      points.push({
        deg,
        t1Pct: (curT1 / ts) * 100,
        t2Pct: (curT2 / ts) * 100,
        t0Pct: (curT0 / ts) * 100,
      });
    }
    return points;
  }, [m, ts]);

  // Angle within sector
  const alphaDeg = (thetaDeg % 60);

  // Colors for segments
  const getSegColor = (name: string, isCurrent: boolean) => {
    if (name === 'V0') {
      return isCurrent ? 'bg-slate-700 text-white ring-2 ring-slate-400' : 'bg-slate-200 text-slate-700 hover:bg-slate-300';
    }
    if (name === 'V7') {
      return isCurrent ? 'bg-indigo-700 text-white ring-2 ring-indigo-400' : 'bg-indigo-200 text-indigo-800 hover:bg-indigo-300';
    }
    // Active vectors
    return isCurrent ? 'bg-amber-500 text-white ring-2 ring-amber-300 font-bold' : 'bg-sky-500 text-white hover:bg-sky-600';
  };

  // Overmodulation status
  const isOvermodulated = m > 1.0;
  const isSixStepLimit = m >= 1.155;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  How Dwell Times & Volt-Second Balance Work
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Deconstruction of the fundamental PWM time-allocation bar across switching period Ts
                </p>
              </div>
            </div>
          </div>

          {/* Quick interactive scrubbers */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            {/* Theta slider */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300 w-16">Angle θ:</span>
              <input
                type="range"
                min="0"
                max="359"
                step="1"
                value={Math.round(thetaDeg)}
                onChange={(e) => {
                  const deg = Number(e.target.value);
                  onUpdateState({ theta: (deg * Math.PI) / 180, thetaDeg: deg });
                }}
                className="w-32 accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
              />
              <span className="font-mono font-bold text-slate-900 dark:text-white w-12 text-right">
                {Math.round(thetaDeg)}°
              </span>
            </div>

            {/* Modulation Index m slider */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300 w-24">Index m:</span>
              <input
                type="range"
                min="0"
                max="1.25"
                step="0.01"
                value={m}
                onChange={(e) => onUpdateState({ m: Number(e.target.value) })}
                className="w-28 accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
              />
              <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400 w-10 text-right">
                {m.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 7-Segment Dwell Time Bar Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Symmetrical 7-Segment Dwell Time Breakdown Bar (Ts = {(ts * 1e6).toFixed(1)} µs)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sector {sector} (θ = {thetaDeg.toFixed(1)}°, sector relative angle α = {alphaDeg.toFixed(1)}°)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-xs bg-slate-300 dark:bg-slate-600 inline-block"></span>
              <span className="text-slate-600 dark:text-slate-300">Zero Vector V0(000)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-xs bg-sky-500 inline-block"></span>
              <span className="text-slate-600 dark:text-slate-300">Active Vectors (V1..V6)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-xs bg-indigo-300 dark:bg-indigo-500 inline-block"></span>
              <span className="text-slate-600 dark:text-slate-300">Zero Vector V7(111)</span>
            </span>
          </div>
        </div>

        {/* Stacked Proportional Bar */}
        <div className="relative mt-3 mb-2">
          {/* Main Bar */}
          <div className="h-16 w-full flex rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner bg-slate-100 dark:bg-slate-800 p-0.5 gap-0.5">
            {segments.map((seg, idx) => {
              const widthPct = ((seg.tEnd - seg.tStart) * 100);
              const durUs = (seg.duration * 1e6).toFixed(1);
              const isCurrent = state.subCycleProgress >= seg.tStart && state.subCycleProgress < seg.tEnd;

              return (
                <div
                  key={`bar-seg-${idx}`}
                  style={{ width: `${widthPct}%` }}
                  className={`h-full flex flex-col items-center justify-center transition-all duration-150 rounded-lg text-xs cursor-pointer select-none ${getSegColor(seg.name, isCurrent)}`}
                  onClick={() => onUpdateState({ subCycleProgress: (seg.tStart + seg.tEnd) / 2 })}
                  title={`Segment ${idx + 1}: ${seg.name} [${seg.bits.join(' ')}]\nDuration: ${durUs} µs (${widthPct.toFixed(1)}%)\nClick to jump playhead here`}
                >
                  <span className="font-bold tracking-tight text-[11px] sm:text-xs">
                    {seg.name}
                  </span>
                  <span className="text-[10px] opacity-90 font-mono">
                    {durUs} µs
                  </span>
                  <span className="text-[9px] opacity-75 hidden sm:inline font-mono">
                    ({widthPct.toFixed(1)}%)
                  </span>
                </div>
              );
            })}
          </div>

          {/* Sub-cycle live playhead pin */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none transition-transform duration-75"
            style={{
              left: `${state.subCycleProgress * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="h-full w-0.5 bg-red-600 shadow-md relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                t = {(state.subCycleProgress * ts * 1e6).toFixed(1)} µs
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-600"></div>
            </div>
          </div>
        </div>

        {/* Math Summary Cards under the bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-900 dark:text-sky-300">Vector 1 (T1)</span>
              <span className="text-xs px-2 py-0.5 rounded bg-sky-200 dark:bg-sky-900/80 text-sky-800 dark:text-sky-200 font-mono font-bold">
                {((t1 / ts) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-sky-950 dark:text-sky-100 mt-1">
              {(t1 * 1e6).toFixed(2)} µs
            </div>
            <p className="text-[11px] text-sky-700 dark:text-sky-400 mt-1">
              T1 = m · Ts · sin(60° - α) / sin(60°)
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Vector 2 (T2)</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 font-mono font-bold">
                {((t2 / ts) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-950 dark:text-emerald-100 mt-1">
              {(t2 * 1e6).toFixed(2)} µs
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
              T2 = m · Ts · sin(α) / sin(60°)
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">Total Zero Time (T0)</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 font-mono font-bold">
                {((t0 / ts) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-indigo-950 dark:text-indigo-100 mt-1">
              {(t0 * 1e6).toFixed(2)} µs
            </div>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-1">
              Split into V0 ({((t0 / 2) * 1e6).toFixed(1)} µs) & V7 ({((t0 / 2) * 1e6).toFixed(1)} µs)
            </p>
          </div>

          <div className={`p-3.5 rounded-lg border ${
            isOvermodulated 
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200' 
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Modulation State</span>
              {isOvermodulated ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Overmod
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                  Linear
                </span>
              )}
            </div>
            <div className="text-lg font-bold font-mono mt-1">
              {isSixStepLimit ? 'Six-Step Square' : isOvermodulated ? 'Mode 1 Clipping' : 'Symmetric Linear'}
            </div>
            <p className="text-[11px] opacity-80 mt-1">
              Active Sum: {(((t1 + t2) / ts) * 100).toFixed(1)}% of Ts
            </p>
          </div>
        </div>
      </div>

      {/* Two Columns: 360° Trend Graph & Volt-Second Balance Derivation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Continuous 360° Dwell Times Graph */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Continuous 360° Dwell Times Trend: T1(θ), T2(θ), T0(θ)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Observe the trigonometric sinusoidal handover between T1 and T2 every 60°
              </p>
            </div>
          </div>

          {/* SVG Multi-curve plot */}
          <div className="relative flex-1 w-full my-3 min-h-[220px]">
            <svg viewBox="0 0 500 200" className="w-full h-full font-sans select-none">
              {/* Sector background alternating bands */}
              {[0, 1, 2, 3, 4, 5].map((s) => (
                <g key={`band-${s}`}>
                  <rect
                    x={40 + (s * 420) / 6}
                    y={20}
                    width={420 / 6}
                    height={150}
                    className={s % 2 === 0 ? 'fill-slate-50 dark:fill-slate-800/40' : 'fill-white dark:fill-slate-900/40'}
                  />
                  <text
                    x={40 + (s * 420) / 6 + 420 / 12}
                    y={15}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    Sec {s + 1}
                  </text>
                  <line
                    x1={40 + (s * 420) / 6}
                    y1={20}
                    x2={40 + (s * 420) / 6}
                    y2={170}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    className="stroke-slate-200 dark:stroke-slate-700"
                  />
                </g>
              ))}

              {/* Horizontal Grid lines */}
              {[0, 25, 50, 75, 100].map((pct) => {
                const y = 170 - (pct / 100) * 150;
                return (
                  <g key={`grid-y-${pct}`}>
                    <line x1="40" y1={y} x2="460" y2={y} className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" />
                    <text x="35" y={y + 3} textAnchor="end" fill="#94a3b8" fontSize="8">
                      {pct}%
                    </text>
                  </g>
                );
              })}

              {/* T1 Curve (Sky Blue) */}
              <path
                d={dwellCurves.reduce((acc, p, i) => {
                  const x = 40 + (p.deg / 360) * 420;
                  const y = 170 - (p.t1Pct / 100) * 150;
                  return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, '')}
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.2"
              />

              {/* T2 Curve (Emerald Green) */}
              <path
                d={dwellCurves.reduce((acc, p, i) => {
                  const x = 40 + (p.deg / 360) * 420;
                  const y = 170 - (p.t2Pct / 100) * 150;
                  return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, '')}
                fill="none"
                stroke="#059669"
                strokeWidth="2.2"
              />

              {/* T0 Curve (Indigo/Purple) */}
              <path
                d={dwellCurves.reduce((acc, p, i) => {
                  const x = 40 + (p.deg / 360) * 420;
                  const y = 170 - (p.t0Pct / 100) * 150;
                  return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, '')}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="3 2"
              />

              {/* Current Angle Cursor */}
              {(() => {
                const curX = 40 + (thetaDeg / 360) * 420;
                return (
                  <g>
                    <line x1={curX} y1={20} x2={curX} y2={170} stroke="#ef4444" strokeWidth="2" />
                    <circle cx={curX} cy={170 - ((t1 / ts) * 150)} r="3.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx={curX} cy={170 - ((t2 / ts) * 150)} r="3.5" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx={curX} cy={170 - ((t0 / ts) * 150)} r="3.5" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
                  </g>
                );
              })()}

              {/* Bottom Angle Axis */}
              <line x1="40" y1="170" x2="460" y2="170" stroke="#94a3b8" strokeWidth="1.2" />
              {[0, 60, 120, 180, 240, 300, 360].map((deg) => (
                <text
                  key={`deg-lbl-${deg}`}
                  x={40 + (deg / 360) * 420}
                  y="185"
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="8.5"
                >
                  {deg}°
                </text>
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5 font-semibold text-sky-700 dark:text-sky-400">
              <span className="h-2.5 w-5 bg-sky-600 rounded-xs"></span> T1 (Vector A)
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="h-2.5 w-5 bg-emerald-600 rounded-xs"></span> T2 (Vector B)
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-400">
              <span className="h-2.5 w-5 bg-indigo-600 rounded-xs border-dashed border"></span> T0 (Zero Vectors)
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400">
              <span className="h-2.5 w-0.5 bg-red-600"></span> Current θ ({Math.round(thetaDeg)}°)
            </span>
          </div>
        </div>

        {/* Volt-Second Balance Principle & Mathematical Laws */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Compass className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Volt-Second Balance Vector Decomposition
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  How discrete switching states synthesize a continuous rotating flux
                </p>
              </div>
            </div>

            {/* Core Equation Box */}
            <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-lg p-3.5 my-3 font-mono text-xs leading-relaxed shadow-sm border border-slate-800">
              <div className="text-amber-400 font-bold mb-1">
                Volt-Second Balance Principle:
              </div>
              <div>
                V_ref · Ts = V_α · T1 + V_β · T2 + V_0 · T0
              </div>
              <div className="text-slate-400 text-[11px] mt-1">
                Dividing by Ts yields the average output voltage vector over one switching sub-cycle:
              </div>
              <div className="text-emerald-400 mt-1">
                &lt;V_out&gt; = d1 · V_α + d2 · V_β + d0 · 0 = V_ref
              </div>
            </div>

            {/* Step-by-step numbers for current state */}
            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">1. Sector Angle α:</span>
                α = θ - (Sector - 1) · 60° = {thetaDeg.toFixed(1)}° - {(sector - 1) * 60}° = <strong className="text-indigo-600 dark:text-indigo-400">{alphaDeg.toFixed(1)}°</strong>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">2. Dwell Times Calculation:</span>
                <div className="font-mono text-[11px] space-y-0.5 text-slate-600 dark:text-slate-300">
                  <div>T1 = {m.toFixed(2)} · {(ts * 1e6).toFixed(0)}µs · sin(60° - {alphaDeg.toFixed(1)}°) / sin(60°) = <strong className="text-sky-700 dark:text-sky-400">{(t1 * 1e6).toFixed(1)} µs</strong></div>
                  <div>T2 = {m.toFixed(2)} · {(ts * 1e6).toFixed(0)}µs · sin({alphaDeg.toFixed(1)}°) / sin(60°) = <strong className="text-emerald-700 dark:text-emerald-400">{(t2 * 1e6).toFixed(1)} µs</strong></div>
                  <div>T0 = Ts - (T1 + T2) = <strong className="text-indigo-700 dark:text-indigo-400">{(t0 * 1e6).toFixed(1)} µs</strong></div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">3. Symmetrical Distribution:</span>
                To minimize switching losses, zero vector time T0 is split symmetrically:
                <div className="font-mono text-[11px] mt-1 text-slate-800 dark:text-slate-200">
                  T000 = T0 / 4 = <strong className="text-slate-900 dark:text-white">{((t0 / 4) * 1e6).toFixed(1)} µs</strong> at the start & end, and T111 = T0 / 2 = <strong className="text-indigo-800 dark:text-indigo-300">{((t0 / 2) * 1e6).toFixed(1)} µs</strong> in the center.
                </div>
              </div>
            </div>
          </div>

          {/* Overmodulation Callout */}
          {isOvermodulated && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <strong>Overmodulation Active (m = {m.toFixed(2)} &gt; 1.0):</strong> Active vectors exceed Ts! Dwell times are scaled down by {(ts / (t1 + t2)).toFixed(3)} to fit inside Ts, zero vector time vanishes (T0 = 0), introducing low-order harmonics (5th, 7th).
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
