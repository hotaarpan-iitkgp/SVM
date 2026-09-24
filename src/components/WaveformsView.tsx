import React, { useMemo, useState } from 'react';
import { SvpwmState } from '../types';
import { generateCycleWaveforms } from '../utils/svpwm';
import { Layers, Activity, Sliders, Eye } from 'lucide-react';

interface WaveformsViewProps {
  state: SvpwmState;
  onUpdateState: (partial: Partial<SvpwmState>) => void;
}

export const WaveformsView: React.FC<WaveformsViewProps> = ({ state, onUpdateState }) => {
  const [activeTab, setActiveTab] = useState<'saddle' | 'pwm' | 'duties'>('saddle');
  const [showZso, setShowZso] = useState(true);

  // Generate waveform points over 360 degrees
  const waveforms = useMemo(() => {
    return generateCycleWaveforms(state.m, state.vdc, state.fsw, 360);
  }, [state.m, state.vdc, state.fsw]);

  // SVG dimensions
  const width = 640;
  const height = 230;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const midY = padTop + plotHeight / 2;

  // Max peak for scaling
  const maxVoltage = state.vdc * 0.7; // ~280V

  // Coordinate helper: angle 0..360 -> X
  const toX = (deg: number) => padLeft + (deg / 360) * plotWidth;

  // Voltage helper: V -> Y
  const toY = (v: number) => midY - (v / maxVoltage) * (plotHeight / 2);

  // Duty cycle helper: 0..1 -> Y
  const toYDuty = (d: number) => padTop + plotHeight - d * plotHeight;

  // Build SVG path from key
  const buildPath = (key: keyof (typeof waveforms)[0]) => {
    return waveforms.reduce((acc, pt, i) => {
      const x = toX(pt.thetaDeg);
      const val = pt[key] as number;
      const y = activeTab === 'duties' ? toYDuty(val) : toY(val);
      return acc + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, '');
  };

  // Sector lines at 60, 120, 180, 240, 300 degrees
  const sectorAngles = [60, 120, 180, 240, 300];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col h-full">
      {/* Title & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-indigo-600" />
            Full-Cycle Waveforms (0° to 360°)
          </h2>
          <p className="text-xs text-slate-500">
            {activeTab === 'saddle' && 'Saddle waveform: Fundamental + Zero-Sequence Common-Mode Offset'}
            {activeTab === 'pwm' && 'Instantaneous inverter PWM pulsed voltages & low-pass filtered fundamental'}
            {activeTab === 'duties' && 'Leg duty cycles Da(θ), Db(θ), Dc(θ) across the 6 Hexagon Sectors'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('saddle')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'saddle'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Saddle Reference
          </button>
          <button
            onClick={() => setActiveTab('pwm')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'pwm'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PWM & Filtered AC
          </button>
          <button
            onClick={() => setActiveTab('duties')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'duties'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Duty Cycles
          </button>
        </div>
      </div>

      {/* SVG Plot */}
      <div className="relative flex-1 w-full my-2 min-h-[220px] flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-sans">
          {/* Grid lines & zero axis */}
          <line
            x1={padLeft}
            y1={midY}
            x2={padLeft + plotWidth}
            y2={midY}
            stroke="#cbd5e1"
            strokeWidth="1.2"
          />

          {/* Sector Boundary vertical lines */}
          {sectorAngles.map((deg, idx) => {
            const x = toX(deg);
            return (
              <g key={`sec-line-${deg}`}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + plotHeight}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={x - (plotWidth / 12)}
                  y={padTop + 10}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8"
                  fontWeight="bold"
                >
                  Sec {idx + 1}
                </text>
              </g>
            );
          })}
          {/* Sector 6 text */}
          <text
            x={toX(330)}
            y={padTop + 10}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="8"
            fontWeight="bold"
          >
            Sec 6
          </text>

          {/* Render based on selected tab */}
          {activeTab === 'saddle' && (
            <g>
              {/* Zero-sequence offset (ZSO) */}
              {showZso && (
                <path
                  d={buildPath('vZso')}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.85"
                />
              )}

              {/* Pure Sine Reference Phase A (Faint reference) */}
              <path
                d={buildPath('vaSin')}
                fill="none"
                stroke="#93c5fd"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />

              {/* SVPWM Saddle Waveform Phase A */}
              <path
                d={buildPath('vaSvpwm')}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.4"
              />

              {/* SVPWM Saddle Waveform Phase B */}
              <path
                d={buildPath('vbSvpwm')}
                fill="none"
                stroke="#059669"
                strokeWidth="1.8"
                opacity="0.85"
              />

              {/* SVPWM Saddle Waveform Phase C */}
              <path
                d={buildPath('vcSvpwm')}
                fill="none"
                stroke="#d97706"
                strokeWidth="1.8"
                opacity="0.85"
              />
            </g>
          )}

          {activeTab === 'pwm' && (
            <g>
              {/* Line-to-line PWM pulses Vab */}
              <path
                d={buildPath('vabPwm')}
                fill="none"
                stroke="#93c5fd"
                strokeWidth="1.2"
                opacity="0.7"
              />

              {/* Filtered phase-to-neutral fundamental Van */}
              <path
                d={buildPath('vanFiltered')}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
              />
            </g>
          )}

          {activeTab === 'duties' && (
            <g>
              {/* 50% centerline */}
              <line
                x1={padLeft}
                y1={toYDuty(0.5)}
                x2={padLeft + plotWidth}
                y2={toYDuty(0.5)}
                stroke="#cbd5e1"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x={padLeft - 6} y={toYDuty(0.5) + 3} textAnchor="end" fill="#94a3b8" fontSize="8">
                0.5
              </text>
              <text x={padLeft - 6} y={padTop + 6} textAnchor="end" fill="#94a3b8" fontSize="8">
                1.0
              </text>
              <text x={padLeft - 6} y={padTop + plotHeight} textAnchor="end" fill="#94a3b8" fontSize="8">
                0.0
              </text>

              {/* Duty A */}
              <path d={buildPath('da')} fill="none" stroke="#2563eb" strokeWidth="2.2" />
              {/* Duty B */}
              <path d={buildPath('db')} fill="none" stroke="#059669" strokeWidth="2.2" />
              {/* Duty C */}
              <path d={buildPath('dc')} fill="none" stroke="#d97706" strokeWidth="2.2" />
            </g>
          )}

          {/* Synchronized Angle Indicator Line (Current Theta) */}
          {(() => {
            const currentX = toX(state.thetaDeg);
            return (
              <g>
                <line
                  x1={currentX}
                  y1={padTop}
                  x2={currentX}
                  y2={padTop + plotHeight}
                  stroke="#ef4444"
                  strokeWidth="2"
                />
                <circle cx={currentX} cy={midY} r="4" fill="#ef4444" />
                <text
                  x={currentX}
                  y={padTop + plotHeight + 14}
                  textAnchor="middle"
                  fill="#ef4444"
                  fontSize="9"
                  fontWeight="bold"
                >
                  θ = {state.thetaDeg}°
                </text>
              </g>
            );
          })()}

          {/* X Axis Degree Markers */}
          <line
            x1={padLeft}
            y1={padTop + plotHeight}
            x2={padLeft + plotWidth}
            y2={padTop + plotHeight}
            stroke="#94a3b8"
            strokeWidth="1.2"
          />
          {[0, 60, 120, 180, 240, 300, 360].map((deg) => (
            <text
              key={`x-label-${deg}`}
              x={toX(deg)}
              y={padTop + plotHeight + 24}
              textAnchor="middle"
              fill="#64748b"
              fontSize="8.5"
            >
              {deg}°
            </text>
          ))}
        </svg>
      </div>

      {/* Legend & Explanation Bar */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        {activeTab === 'saddle' && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-blue-700 font-semibold">
              <span className="w-3 h-1 bg-blue-600 rounded"></span>
              Va* (Saddle)
            </span>
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-3 h-1 bg-emerald-600 rounded"></span>
              Vb*
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-semibold">
              <span className="w-3 h-1 bg-amber-600 rounded"></span>
              Vc*
            </span>
            <span className="flex items-center gap-1 text-purple-700 font-medium">
              <span className="w-3 h-0.5 bg-purple-500 border-dashed rounded"></span>
              Zero-Sequence Vzso
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-3 h-0.5 bg-blue-300 border-dashed rounded"></span>
              Pure Sinusoid
            </span>
          </div>
        )}

        {activeTab === 'pwm' && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-blue-700 font-semibold">
              <span className="w-3 h-1.5 bg-blue-600 rounded"></span>
              Van Filtered Fundamental
            </span>
            <span className="flex items-center gap-1 text-sky-500">
              <span className="w-3 h-1 bg-sky-400 rounded"></span>
              Vab Instantaneous PWM Pulses
            </span>
          </div>
        )}

        {activeTab === 'duties' && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-blue-700 font-semibold">
              <span className="w-3 h-1 bg-blue-600 rounded"></span>
              Duty A (Da)
            </span>
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-3 h-1 bg-emerald-600 rounded"></span>
              Duty B (Db)
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-semibold">
              <span className="w-3 h-1 bg-amber-600 rounded"></span>
              Duty C (Dc)
            </span>
          </div>
        )}

        {/* Note on cancellation */}
        <span className="text-[11px] text-slate-400 italic">
          Vab = Va* - Vb* = Va - Vb (Zero-sequence cancels out completely!)
        </span>
      </div>
    </div>
  );
};
