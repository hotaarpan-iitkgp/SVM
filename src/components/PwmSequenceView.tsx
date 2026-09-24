import React, { useState } from 'react';
import { SvpwmState } from '../types';
import { getSvpwm7Segments } from '../utils/svpwm';
import { Clock, Sliders, Info, CheckCircle2 } from 'lucide-react';

interface PwmSequenceViewProps {
  state: SvpwmState;
  onUpdateState: (partial: Partial<SvpwmState>) => void;
}

export const PwmSequenceView: React.FC<PwmSequenceViewProps> = ({ state, onUpdateState }) => {
  const [carrierMode, setCarrierMode] = useState<'v-shape' | 'peak-shape'>('v-shape');

  // Compute exact 7 segments for current sector and dwell times
  const segments = getSvpwm7Segments(
    state.sector,
    state.t1,
    state.t2,
    state.t0,
    state.ts
  );

  // Active segment determined by subCycleProgress
  const tau = state.subCycleProgress;
  let activeSegIdx = 0;
  for (let i = 0; i < segments.length; i++) {
    if (tau >= segments[i].tStart && tau < segments[i].tEnd) {
      activeSegIdx = i;
      break;
    }
  }
  if (tau >= segments[segments.length - 1].tStart) {
    activeSegIdx = segments.length - 1;
  }
  const currentSeg = segments[activeSegIdx] || segments[0];

  // SVG dimensions for timing diagram - fitted to fill the complete Y axis
  const width = 640;
  const height = 430;
  const padLeft = 72;
  const padRight = 48;
  const plotWidth = width - padLeft - padRight;

  // Carrier plot vertical bounds (generous 120px span to fill complete upper Y-axis)
  const carrierTop = 36;
  const carrierBottom = 156;
  const carrierSpan = carrierBottom - carrierTop;
  const midX = padLeft + plotWidth * 0.5;

  // Carrier Path
  const carrierPath = carrierMode === 'v-shape'
    ? `M ${padLeft} ${carrierTop} L ${midX} ${carrierBottom} L ${padLeft + plotWidth} ${carrierTop}`
    : `M ${padLeft} ${carrierBottom} L ${midX} ${carrierTop} L ${padLeft + plotWidth} ${carrierBottom}`;

  // Compare level Y position
  const toCarrierY = (d: number) => {
    return carrierBottom - d * carrierSpan;
  };

  const daY = toCarrierY(state.da);
  const dbY = toCarrierY(state.db);
  const dcY = toCarrierY(state.dc);

  // Gate pulses vertical layout - tall 34px pulses filling complete lower Y-axis
  const gateAH = 188;
  const gateBH = 248;
  const gateCH = 308;
  const pulseH = 34;
  const timeAxisY = 376;

  // Digital gate pulse path
  const getGatePath = (duty: number, baseY: number) => {
    const tStart = Math.max(0, Math.min(0.5, (1 - duty) / 2));
    const tEnd = Math.max(0.5, Math.min(1, 1 - (1 - duty) / 2));

    const xStart = padLeft + tStart * plotWidth;
    const xEnd = padLeft + tEnd * plotWidth;

    const yLow = baseY + pulseH;
    const yHigh = baseY;

    if (duty <= 0.001) {
      return `M ${padLeft} ${yLow} L ${padLeft + plotWidth} ${yLow}`;
    }
    if (duty >= 0.999) {
      return `M ${padLeft} ${yHigh} L ${padLeft + plotWidth} ${yHigh}`;
    }

    return `M ${padLeft} ${yLow} L ${xStart} ${yLow} L ${xStart} ${yHigh} L ${xEnd} ${yHigh} L ${xEnd} ${yLow} L ${padLeft + plotWidth} ${yLow}`;
  };

  // Transitions X coordinates for each phase
  const getTransitionsX = (duty: number) => {
    const tStart = Math.max(0, Math.min(0.5, (1 - duty) / 2));
    const tEnd = Math.max(0.5, Math.min(1, 1 - (1 - duty) / 2));
    return {
      xStart: padLeft + tStart * plotWidth,
      xEnd: padLeft + tEnd * plotWidth,
    };
  };

  const transA = getTransitionsX(state.da);
  const transB = getTransitionsX(state.db);
  const transC = getTransitionsX(state.dc);

  const cursorX = padLeft + tau * plotWidth;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 flex flex-col justify-between h-full min-h-[560px] transition-colors">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              Symmetrical 7-Segment PWM Sub-Cycle Timing
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              Ts = {(state.ts * 1e6).toFixed(0)} µs ({state.fsw / 1000} kHz)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sector {state.sector} • Full Y-axis calibrated comparison & gate waveforms
          </p>
        </div>

        {/* Carrier style switch & Vector status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setCarrierMode('v-shape')}
              title="Standard V-shape carrier where duty compare line intersects exactly at switching transitions"
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                carrierMode === 'v-shape'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              V-Carrier (1→0→1)
            </button>
            <button
              onClick={() => setCarrierMode('peak-shape')}
              title="Peak-shape triangular carrier (0→1→0)"
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                carrierMode === 'peak-shape'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Peak-Carrier (0→1→0)
            </button>
          </div>

          {/* Current Active Vector Pill */}
          <div className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-800 text-white px-2.5 py-1 rounded-lg text-xs font-mono border border-slate-800 dark:border-slate-700">
            <span className="text-slate-400">Vector:</span>
            <span className="font-bold text-amber-400">{currentSeg.name}</span>
            <span className="text-slate-300">[{currentSeg.bits.join(' ')}]</span>
          </div>
        </div>
      </div>

      {/* SVG Timing Diagram - fills complete Y-axis */}
      <div className="relative flex-1 w-full my-2 flex items-center justify-center min-h-[350px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none font-sans"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Segment Background Shading & Boundary Lines */}
          {segments.map((seg, i) => {
            const x = padLeft + seg.tStart * plotWidth;
            const segW = (seg.tEnd - seg.tStart) * plotWidth;
            const isSegActive = i === activeSegIdx;

            return (
              <g key={`seg-bg-${i}`}>
                <rect
                  x={x}
                  y={22}
                  width={Math.max(1, segW)}
                  height={timeAxisY - 22}
                  fill={isSegActive ? '#fef3c7' : i % 2 === 0 ? '#f8fafc' : '#ffffff'}
                  opacity={isSegActive ? 0.75 : 0.9}
                  className="transition-colors duration-150"
                />
                {/* Boundary line */}
                <line
                  x1={x}
                  y1={22}
                  x2={x}
                  y2={timeAxisY}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                {/* Segment Top Label: Vector + Duration */}
                <text
                  x={x + segW / 2}
                  y={17}
                  textAnchor="middle"
                  fill={isSegActive ? '#b45309' : '#64748b'}
                  fontSize="9.5"
                  fontWeight={isSegActive ? 'bold' : '600'}
                >
                  {seg.name} ({seg.label})
                </text>
              </g>
            );
          })}

          {/* Rightmost boundary line */}
          <line
            x1={padLeft + plotWidth}
            y1={22}
            x2={padLeft + plotWidth}
            y2={timeAxisY}
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* ===== CARRIER WAVEFORM SECTION ===== */}
          {/* Horizontal carrier grid lines at 1.0, 0.5, 0.0 */}
          <line x1={padLeft} y1={carrierTop} x2={padLeft + plotWidth} y2={carrierTop} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={padLeft} y1={(carrierTop + carrierBottom) / 2} x2={padLeft + plotWidth} y2={(carrierTop + carrierBottom) / 2} stroke="#f1f5f9" strokeWidth="1" />
          <line x1={padLeft} y1={carrierBottom} x2={padLeft + plotWidth} y2={carrierBottom} stroke="#e2e8f0" strokeWidth="1" />

          {/* Left Y-axis ticks for Carrier */}
          <text x={padLeft - 8} y={carrierTop + 4} textAnchor="end" fill="#475569" fontSize="10" fontWeight="bold">
            1.0 (+Vdc)
          </text>
          <text x={padLeft - 8} y={(carrierTop + carrierBottom) / 2 + 3} textAnchor="end" fill="#94a3b8" fontSize="8.5">
            0.5
          </text>
          <text x={padLeft - 8} y={carrierBottom + 3} textAnchor="end" fill="#475569" fontSize="10" fontWeight="bold">
            0.0 (0V)
          </text>
          <text x={padLeft - 8} y={carrierTop + 24} textAnchor="end" fill="#64748b" fontSize="8.5" fontStyle="italic">
            Carrier
          </text>

          {/* Carrier Triangle Path */}
          <path
            d={carrierPath}
            fill="none"
            stroke="#475569"
            strokeWidth="2.2"
            strokeDasharray="4 3"
          />

          {/* Vertical dashed guideline drops from carrier intersections to gate transitions */}
          {carrierMode === 'v-shape' && (
            <g opacity="0.65">
              {/* Da drops */}
              <line x1={transA.xStart} y1={daY} x2={transA.xStart} y2={gateAH + pulseH} stroke="#2563eb" strokeWidth="1.2" strokeDasharray="2 2" />
              <line x1={transA.xEnd} y1={daY} x2={transA.xEnd} y2={gateAH + pulseH} stroke="#2563eb" strokeWidth="1.2" strokeDasharray="2 2" />
              <circle cx={transA.xStart} cy={daY} r="3" fill="#2563eb" />
              <circle cx={transA.xEnd} cy={daY} r="3" fill="#2563eb" />

              {/* Db drops */}
              <line x1={transB.xStart} y1={dbY} x2={transB.xStart} y2={gateBH + pulseH} stroke="#059669" strokeWidth="1.2" strokeDasharray="2 2" />
              <line x1={transB.xEnd} y1={dbY} x2={transB.xEnd} y2={gateBH + pulseH} stroke="#059669" strokeWidth="1.2" strokeDasharray="2 2" />
              <circle cx={transB.xStart} cy={dbY} r="3" fill="#059669" />
              <circle cx={transB.xEnd} cy={dbY} r="3" fill="#059669" />

              {/* Dc drops */}
              <line x1={transC.xStart} y1={dcY} x2={transC.xStart} y2={gateCH + pulseH} stroke="#d97706" strokeWidth="1.2" strokeDasharray="2 2" />
              <line x1={transC.xEnd} y1={dcY} x2={transC.xEnd} y2={gateCH + pulseH} stroke="#d97706" strokeWidth="1.2" strokeDasharray="2 2" />
              <circle cx={transC.xStart} cy={dcY} r="3" fill="#d97706" />
              <circle cx={transC.xEnd} cy={dcY} r="3" fill="#d97706" />
            </g>
          )}

          {/* Compare Lines Da, Db, Dc */}
          {/* Phase A compare */}
          <line
            x1={padLeft}
            y1={daY}
            x2={padLeft + plotWidth}
            y2={daY}
            stroke="#2563eb"
            strokeWidth="1.8"
          />
          <text x={padLeft + plotWidth + 6} y={daY + 3.5} fill="#2563eb" fontSize="9.5" fontWeight="bold">
            Da={Math.round(state.da * 100)}%
          </text>

          {/* Phase B compare */}
          <line
            x1={padLeft}
            y1={dbY}
            x2={padLeft + plotWidth}
            y2={dbY}
            stroke="#059669"
            strokeWidth="1.8"
          />
          <text x={padLeft + plotWidth + 6} y={dbY + 3.5} fill="#059669" fontSize="9.5" fontWeight="bold">
            Db={Math.round(state.db * 100)}%
          </text>

          {/* Phase C compare */}
          <line
            x1={padLeft}
            y1={dcY}
            x2={padLeft + plotWidth}
            y2={dcY}
            stroke="#d97706"
            strokeWidth="1.8"
          />
          <text x={padLeft + plotWidth + 6} y={dcY + 3.5} fill="#d97706" fontSize="9.5" fontWeight="bold">
            Dc={Math.round(state.dc * 100)}%
          </text>

          {/* Horizontal section divider */}
          <line
            x1={padLeft - 20}
            y1={172}
            x2={padLeft + plotWidth + 20}
            y2={172}
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text x={padLeft - 8} y={175} textAnchor="end" fill="#94a3b8" fontSize="8" fontWeight="bold">
            GATES
          </text>

          {/* ===== DIGITAL GATE WAVEFORMS SECTION (Sa, Sb, Sc) ===== */}
          {/* Gate A */}
          <text x={padLeft - 8} y={gateAH + 14} textAnchor="end" fill="#2563eb" fontSize="10" fontWeight="bold">
            Sa (Leg A)
          </text>
          <text x={padLeft - 8} y={gateAH + 4} textAnchor="end" fill="#94a3b8" fontSize="7.5">
            HIGH
          </text>
          <text x={padLeft - 8} y={gateAH + pulseH} textAnchor="end" fill="#94a3b8" fontSize="7.5">
            LOW
          </text>
          <path
            d={getGatePath(state.da, gateAH)}
            fill="#dbeafe"
            fillOpacity="0.6"
            stroke="#2563eb"
            strokeWidth="2.2"
          />

          {/* Gate B */}
          <text x={padLeft - 8} y={gateBH + 14} textAnchor="end" fill="#059669" fontSize="10" fontWeight="bold">
            Sb (Leg B)
          </text>
          <text x={padLeft - 8} y={gateBH + 4} textAnchor="end" fill="#94a3b8" fontSize="7.5">
            HIGH
          </text>
          <text x={padLeft - 8} y={gateBH + pulseH} textAnchor="end" fill="#94a3b8" fontSize="7.5">
            LOW
          </text>
          <path
            d={getGatePath(state.db, gateBH)}
            fill="#d1fae5"
            fillOpacity="0.6"
            stroke="#059669"
            strokeWidth="2.2"
          />

          {/* Gate C */}
          <text x={padLeft - 8} y={gateCH + 14} textAnchor="end" fill="#d97706" fontSize="10" fontWeight="bold">
            Sc (Leg C)
          </text>
          <text x={padLeft - 8} y={gateCH + 4} textAnchor="end" fill="#94a3b8" fontSize="7.5">
            HIGH
          </text>
          <text x={padLeft - 8} y={gateCH + pulseH} textAnchor="end" fill="#94a3b8" fontSize="7.5">
            LOW
          </text>
          <path
            d={getGatePath(state.dc, gateCH)}
            fill="#fef3c7"
            fillOpacity="0.6"
            stroke="#d97706"
            strokeWidth="2.2"
          />

          {/* ===== TIME AXIS & PLAYHEAD ===== */}
          {/* Bottom time axis line */}
          <line
            x1={padLeft}
            y1={timeAxisY}
            x2={padLeft + plotWidth}
            y2={timeAxisY}
            stroke="#64748b"
            strokeWidth="1.5"
          />
          {/* Ticks on time axis */}
          <line x1={padLeft} y1={timeAxisY} x2={padLeft} y2={timeAxisY + 5} stroke="#64748b" strokeWidth="1.5" />
          <line x1={padLeft + plotWidth / 2} y1={timeAxisY} x2={padLeft + plotWidth / 2} y2={timeAxisY + 5} stroke="#64748b" strokeWidth="1.5" />
          <line x1={padLeft + plotWidth} y1={timeAxisY} x2={padLeft + plotWidth} y2={timeAxisY + 5} stroke="#64748b" strokeWidth="1.5" />

          <text x={padLeft} y={timeAxisY + 16} textAnchor="start" fill="#64748b" fontSize="9" fontWeight="600">
            0 µs
          </text>
          <text x={padLeft + plotWidth / 2} y={timeAxisY + 16} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600">
            Ts / 2 ({((state.ts * 1e6) / 2).toFixed(0)} µs)
          </text>
          <text x={padLeft + plotWidth} y={timeAxisY + 16} textAnchor="end" fill="#64748b" fontSize="9" fontWeight="600">
            Ts ({(state.ts * 1e6).toFixed(0)} µs)
          </text>

          {/* Instantaneous Time Playhead spanning complete Y axis */}
          <g>
            <line
              x1={cursorX}
              y1={20}
              x2={cursorX}
              y2={timeAxisY}
              stroke="#ef4444"
              strokeWidth="2.2"
            />
            <circle cx={cursorX} cy={22} r="4" fill="#ef4444" />
            <rect
              x={cursorX - 32}
              y={timeAxisY + 22}
              width="64"
              height="18"
              rx="4"
              fill="#ef4444"
            />
            <text
              x={cursorX}
              y={timeAxisY + 34}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
            >
              t={(tau * state.ts * 1e6).toFixed(1)}µs
            </text>
          </g>
        </svg>
      </div>

      {/* Sub-cycle scrub slider and leg status pills (anchored firmly at bottom) */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 shrink-0 bg-white dark:bg-slate-900 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span className="font-semibold flex items-center gap-1.5">
            <span>Sub-Cycle Scrubber (within Ts):</span>
            <span className="text-slate-900 dark:text-slate-100 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {(state.subCycleProgress * 100).toFixed(1)}% • {(state.subCycleProgress * state.ts * 1e6).toFixed(1)} µs
            </span>
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Active Segment: <strong className="text-slate-900 dark:text-white">{currentSeg.name} [{currentSeg.bits.join(' ')}]</strong> ({currentSeg.label})
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="0.999"
          step="0.002"
          value={state.subCycleProgress}
          onChange={(e) => onUpdateState({ subCycleProgress: Number(e.target.value) })}
          className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
        />

        {/* 3 Legs Quick Status Display */}
        <div className="grid grid-cols-3 gap-2 text-xs text-center mt-0.5">
          <div className={`p-2 rounded-lg border font-mono transition-colors ${
            currentSeg.bits[0] === 1 
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-bold shadow-2xs' 
              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700/60'
          }`}>
            Leg A: {currentSeg.bits[0] === 1 ? 'HIGH (+Vdc)' : 'LOW (0V)'}
          </div>
          <div className={`p-2 rounded-lg border font-mono transition-colors ${
            currentSeg.bits[1] === 1 
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-bold shadow-2xs' 
              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700/60'
          }`}>
            Leg B: {currentSeg.bits[1] === 1 ? 'HIGH (+Vdc)' : 'LOW (0V)'}
          </div>
          <div className={`p-2 rounded-lg border font-mono transition-colors ${
            currentSeg.bits[2] === 1 
              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-bold shadow-2xs' 
              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700/60'
          }`}>
            Leg C: {currentSeg.bits[2] === 1 ? 'HIGH (+Vdc)' : 'LOW (0V)'}
          </div>
        </div>
      </div>
    </div>
  );
};
