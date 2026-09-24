import React, { useState, useEffect, useRef } from 'react';
import { SvpwmState } from '../types';
import { 
  Compass, 
  RotateCw, 
  Play, 
  Pause, 
  Sliders, 
  Sparkles, 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { useCardFullscreen } from '../hooks/useCardFullscreen';
import { FullscreenButton } from './FullscreenButton';

interface RotatingVectorViewProps {
  state: SvpwmState;
  onUpdateState: (partial: Partial<SvpwmState>) => void;
  darkMode?: boolean;
}

export const RotatingVectorView: React.FC<RotatingVectorViewProps> = ({ state, onUpdateState, darkMode }) => {
  // Spatial angles of the 3 coil axes (degrees)
  const [spaceAngleA, setSpaceAngleA] = useState(0);
  const [spaceAngleB, setSpaceAngleB] = useState(120);
  const [spaceAngleC, setSpaceAngleC] = useState(240);

  // Electrical phase angles of the 3 sinusoidal currents (degrees)
  const [phaseAngleA, setPhaseAngleA] = useState(0);
  const [phaseAngleB, setPhaseAngleB] = useState(-120);
  const [phaseAngleC, setPhaseAngleC] = useState(120);

  // Amplitudes of the 3 currents
  const [ampA, setAmpA] = useState(1.0);
  const [ampB, setAmpB] = useState(1.0);
  const [ampC, setAmpC] = useState(1.0);

  // Visual modes
  const [displayMode, setDisplayMode] = useState<'tip-to-tail' | 'origin'>('tip-to-tail');
  const [showAxes, setShowAxes] = useState(true);
  const [showTrajectory, setShowTrajectory] = useState(true);

  // Trajectory buffer of the resultant vector tip
  const [trajectory, setTrajectory] = useState<{ x: number; y: number }[]>([]);

  // Time / angle in radians (driven by state.theta when playing)
  const theta = state.theta;

  // Convert angles to radians
  const spaceRadA = (spaceAngleA * Math.PI) / 180;
  const spaceRadB = (spaceAngleB * Math.PI) / 180;
  const spaceRadC = (spaceAngleC * Math.PI) / 180;

  const phaseRadA = (phaseAngleA * Math.PI) / 180;
  const phaseRadB = (phaseAngleB * Math.PI) / 180;
  const phaseRadC = (phaseAngleC * Math.PI) / 180;

  // Instantaneous scalar values of the 3 phase signals:
  // x_i(t) = Amp * cos(theta + phaseRad)
  const valA = ampA * Math.cos(theta + phaseRadA);
  const valB = ampB * Math.cos(theta + phaseRadB);
  const valC = ampC * Math.cos(theta + phaseRadC);

  // Spatial vector contributions:
  // Each phase pulsates along its fixed physical axis!
  // F_i(t) = x_i(t) * [cos(spaceRad_i), sin(spaceRad_i)]
  const vAx = valA * Math.cos(spaceRadA);
  const vAy = valA * Math.sin(spaceRadA);

  const vBx = valB * Math.cos(spaceRadB);
  const vBy = valB * Math.sin(spaceRadB);

  const vCx = valC * Math.cos(spaceRadC);
  const vCy = valC * Math.sin(spaceRadC);

  // Net resultant rotating vector
  const netX = vAx + vBx + vCx;
  const netY = vAy + vBy + vCy;
  const netMag = Math.sqrt(netX * netX + netY * netY);
  const netAngleDeg = ((Math.atan2(netY, netX) * 180) / Math.PI + 360) % 360;

  // Track trajectory
  useEffect(() => {
    setTrajectory((prev) => {
      const next = [...prev, { x: netX, y: netY }];
      if (next.length > 120) next.shift();
      return next;
    });
  }, [netX, netY]);

  // Clear trajectory when parameters change
  const resetTrajectory = () => {
    setTrajectory([]);
  };

  // Educational Presets
  const applyPreset = (preset: 'balanced-pos' | 'balanced-neg' | 'in-phase' | 'open-phase' | 'two-phase') => {
    resetTrajectory();
    if (preset === 'balanced-pos') {
      setSpaceAngleA(0); setSpaceAngleB(120); setSpaceAngleC(240);
      setPhaseAngleA(0); setPhaseAngleB(-120); setPhaseAngleC(120);
      setAmpA(1.0); setAmpB(1.0); setAmpC(1.0);
    } else if (preset === 'balanced-neg') {
      setSpaceAngleA(0); setSpaceAngleB(120); setSpaceAngleC(240);
      setPhaseAngleA(0); setPhaseAngleB(120); setPhaseAngleC(-120); // Swapped B & C
      setAmpA(1.0); setAmpB(1.0); setAmpC(1.0);
    } else if (preset === 'in-phase') {
      setSpaceAngleA(0); setSpaceAngleB(120); setSpaceAngleC(240);
      setPhaseAngleA(0); setPhaseAngleB(0); setPhaseAngleC(0); // All in phase
      setAmpA(1.0); setAmpB(1.0); setAmpC(1.0);
    } else if (preset === 'open-phase') {
      setSpaceAngleA(0); setSpaceAngleB(120); setSpaceAngleC(240);
      setPhaseAngleA(0); setPhaseAngleB(-120); setPhaseAngleC(120);
      setAmpA(1.0); setAmpB(1.0); setAmpC(0.0); // Phase C missing
    } else if (preset === 'two-phase') {
      setSpaceAngleA(0); setSpaceAngleB(90); setSpaceAngleC(0);
      setPhaseAngleA(0); setPhaseAngleB(-90); setPhaseAngleC(0);
      setAmpA(1.0); setAmpB(1.0); setAmpC(0.0);
    }
  };

  // SVG Geometry
  const size = 440;
  const center = size / 2;
  const scale = 110; // 1.0 unit = 110 pixels

  const toSvgX = (x: number) => center + x * scale;
  const toSvgY = (y: number) => center - y * scale; // Invert Y for standard math orientation

  // Trajectory points string
  const trajectoryPath = trajectory.length > 1
    ? trajectory.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toSvgX(p.x)} ${toSvgY(p.y)}`).join(' ')
    : '';

  // Points for tip-to-tail
  const p0 = { x: toSvgX(0), y: toSvgY(0) };
  const pA = { x: toSvgX(vAx), y: toSvgY(vAy) };
  const pB = { x: toSvgX(vAx + vBx), y: toSvgY(vAx + vBy) }; // Wait, let's fix coordinates
  const pTipB = { x: toSvgX(vAx + vBx), y: toSvgY(vAy + vBy) };
  const pTipC = { x: toSvgX(netX), y: toSvgY(netY) };

  const { isFullscreen, toggleFullscreen, cardRef } = useCardFullscreen();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 transition-colors">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Rotating Vector Formation from 3 Space & Phase Shifted Vectors
                </h1>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Fundamental MMF Theorem
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ferraris & Tesla Principle • 3 Physical Spatial Axes + 3 Time-Varying Sinusoids = Pure Rotating Magnetic Field
              </p>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1">Presets:</span>
            <button
              onClick={() => applyPreset('balanced-pos')}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors"
            >
              Balanced 120° (CCW)
            </button>
            <button
              onClick={() => applyPreset('balanced-neg')}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors"
            >
              Reverse (CW)
            </button>
            <button
              onClick={() => applyPreset('in-phase')}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors"
            >
              In-Phase (Pulsating)
            </button>
            <button
              onClick={() => applyPreset('open-phase')}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors"
            >
              Open Phase C
            </button>
            <button
              onClick={() => applyPreset('two-phase')}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors"
            >
              2-Phase 90°
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Vector Simulation Left, Controls & Waveforms Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): 2D Vector Plane Visualization */}
        <div
          ref={cardRef}
          className={`${
            isFullscreen
              ? 'fixed inset-0 z-50 bg-white dark:bg-slate-950 p-6 sm:p-8 flex flex-col overflow-auto shadow-2xl'
              : 'lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col items-center'
          } transition-colors`}
        >
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                Spatial Vector Addition Plane
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                |F_net| = {netMag.toFixed(3)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setDisplayMode(displayMode === 'tip-to-tail' ? 'origin' : 'tip-to-tail')}
                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Mode: {displayMode === 'tip-to-tail' ? 'Tip-to-Tail Addition' : 'Center Star'}
              </button>
              <button
                onClick={resetTrajectory}
                title="Clear trajectory history"
                className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <FullscreenButton isFullscreen={isFullscreen} onToggle={toggleFullscreen} />
            </div>
          </div>

          {/* SVG Canvas */}
          <div className={`relative my-3 flex items-center justify-center w-full ${isFullscreen ? 'min-h-[500px]' : 'min-h-[420px]'}`}>
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className={`w-full ${isFullscreen ? 'max-w-[750px]' : 'max-w-[500px]'} h-auto select-none font-sans drop-shadow-sm`}
            >
              {/* Stator circular frame */}
              <circle
                cx={center}
                cy={center}
                r={1.5 * scale}
                fill={darkMode ? '#0f172a' : '#f8fafc'}
                stroke={darkMode ? '#334155' : '#cbd5e1'}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <circle
                cx={center}
                cy={center}
                r={scale}
                fill="none"
                stroke={darkMode ? '#1e293b' : '#e2e8f0'}
                strokeWidth="1"
              />

              {/* Physical Winding Spatial Axes */}
              {showAxes && (
                <g opacity="0.6">
                  {/* Axis A */}
                  <line
                    x1={center - 1.6 * scale * Math.cos(spaceRadA)}
                    y1={center + 1.6 * scale * Math.sin(spaceRadA)}
                    x2={center + 1.6 * scale * Math.cos(spaceRadA)}
                    y2={center - 1.6 * scale * Math.sin(spaceRadA)}
                    stroke="#2563eb"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                  {/* Axis B */}
                  <line
                    x1={center - 1.6 * scale * Math.cos(spaceRadB)}
                    y1={center + 1.6 * scale * Math.sin(spaceRadB)}
                    x2={center + 1.6 * scale * Math.cos(spaceRadB)}
                    y2={center - 1.6 * scale * Math.sin(spaceRadB)}
                    stroke="#059669"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                  {/* Axis C */}
                  <line
                    x1={center - 1.6 * scale * Math.cos(spaceRadC)}
                    y1={center + 1.6 * scale * Math.sin(spaceRadC)}
                    x2={center + 1.6 * scale * Math.cos(spaceRadC)}
                    y2={center - 1.6 * scale * Math.sin(spaceRadC)}
                    stroke="#d97706"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />

                  {/* Axis labels at outer perimeter */}
                  <text
                    x={center + 1.7 * scale * Math.cos(spaceRadA)}
                    y={center - 1.7 * scale * Math.sin(spaceRadA) + 4}
                    textAnchor="middle"
                    fill="#2563eb"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    Axis A ({spaceAngleA}°)
                  </text>
                  <text
                    x={center + 1.7 * scale * Math.cos(spaceRadB)}
                    y={center - 1.7 * scale * Math.sin(spaceRadB) + 4}
                    textAnchor="middle"
                    fill="#059669"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    Axis B ({spaceAngleB}°)
                  </text>
                  <text
                    x={center + 1.7 * scale * Math.cos(spaceRadC)}
                    y={center - 1.7 * scale * Math.sin(spaceRadC) + 4}
                    textAnchor="middle"
                    fill="#d97706"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    Axis C ({spaceAngleC}°)
                  </text>
                </g>
              )}

              {/* Trajectory of the Resultant Vector */}
              {showTrajectory && trajectoryPath && (
                <path
                  d={trajectoryPath}
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                  opacity="0.75"
                />
              )}

              {/* Vector Addition Components */}
              {displayMode === 'origin' ? (
                // Center Star Origin Mode
                <g>
                  {/* Vector Fa */}
                  <line
                    x1={center}
                    y1={center}
                    x2={toSvgX(vAx)}
                    y2={toSvgY(vAy)}
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx={toSvgX(vAx)} cy={toSvgY(vAy)} r="4" fill="#2563eb" />

                  {/* Vector Fb */}
                  <line
                    x1={center}
                    y1={center}
                    x2={toSvgX(vBx)}
                    y2={toSvgY(vBy)}
                    stroke="#059669"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx={toSvgX(vBx)} cy={toSvgY(vBy)} r="4" fill="#059669" />

                  {/* Vector Fc */}
                  <line
                    x1={center}
                    y1={center}
                    x2={toSvgX(vCx)}
                    y2={toSvgY(vCy)}
                    stroke="#d97706"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx={toSvgX(vCx)} cy={toSvgY(vCy)} r="4" fill="#d97706" />
                </g>
              ) : (
                // Tip-to-Tail Polygon Mode
                <g>
                  {/* Step 1: Fa from origin */}
                  <line
                    x1={p0.x}
                    y1={p0.y}
                    x2={pA.x}
                    y2={pA.y}
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx={pA.x} cy={pA.y} r="3" fill="#2563eb" />

                  {/* Step 2: Fb attached to tip of Fa */}
                  <line
                    x1={pA.x}
                    y1={pA.y}
                    x2={pTipB.x}
                    y2={pTipB.y}
                    stroke="#059669"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx={pTipB.x} cy={pTipB.y} r="3" fill="#059669" />

                  {/* Step 3: Fc attached to tip of Fb */}
                  <line
                    x1={pTipB.x}
                    y1={pTipB.y}
                    x2={pTipC.x}
                    y2={pTipC.y}
                    stroke="#d97706"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx={pTipC.x} cy={pTipC.y} r="3" fill="#d97706" />
                </g>
              )}

              {/* Resultant Rotating Vector (F_net) from Origin to Final Tip */}
              <line
                x1={center}
                y1={center}
                x2={toSvgX(netX)}
                y2={toSvgY(netY)}
                stroke="#6366f1"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx={toSvgX(netX)} cy={toSvgY(netY)} r="6" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />

              {/* Center Origin Dot */}
              <circle cx={center} cy={center} r="4" fill={darkMode ? '#f8fafc' : '#0f172a'} />
            </svg>
          </div>

          {/* Legend and Status Cards */}
          <div className="w-full grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-center font-mono">
            <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Phase A Vector</span>
              <span className="font-bold text-blue-900 dark:text-blue-200">{valA.toFixed(2)}</span>
            </div>
            <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Phase B Vector</span>
              <span className="font-bold text-emerald-900 dark:text-emerald-200">{valB.toFixed(2)}</span>
            </div>
            <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Phase C Vector</span>
              <span className="font-bold text-amber-900 dark:text-amber-200">{valC.toFixed(2)}</span>
            </div>
            <div className="p-2 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
              <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Resultant F_net</span>
              <span className="font-bold text-indigo-900 dark:text-indigo-200">{netMag.toFixed(2)} ∠{netAngleDeg.toFixed(0)}°</span>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Space & Phase Angle Sliders & Live Signals */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sliders Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-5 transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Space & Phase Angle Controls
              </h3>
              <button
                onClick={() => onUpdateState({ isPlaying: !state.isPlaying })}
                className={`px-3 py-1 rounded text-xs font-semibold text-white transition-colors ${
                  state.isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {state.isPlaying ? 'Pause Rotation' : 'Rotate Field'}
              </button>
            </div>

            {/* Space Angles Sliders (Physical Orientation of Coils) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                  Spatial Axis Angles (Coil Orientation):
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Fixed in Stator</span>
              </div>

              {/* Axis A Space Angle */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Phase A Axis (θ_A):</span>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400">{spaceAngleA}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="360"
                  step="5"
                  value={spaceAngleA}
                  onChange={(e) => { setSpaceAngleA(Number(e.target.value)); resetTrajectory(); }}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
                />
              </div>

              {/* Axis B Space Angle */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Phase B Axis (θ_B):</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{spaceAngleB}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="360"
                  step="5"
                  value={spaceAngleB}
                  onChange={(e) => { setSpaceAngleB(Number(e.target.value)); resetTrajectory(); }}
                  className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
                />
              </div>

              {/* Axis C Space Angle */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Phase C Axis (θ_C):</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{spaceAngleC}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="360"
                  step="5"
                  value={spaceAngleC}
                  onChange={(e) => { setSpaceAngleC(Number(e.target.value)); resetTrajectory(); }}
                  className="w-full accent-amber-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Electrical Phase Shift Sliders (Time-Domain Shift) */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                  Electrical Phase Angles (Time Shift ϕ):
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">cos(ωt + ϕ)</span>
              </div>

              {/* Phase A Phase Shift */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Phase A Shift (ϕ_A):</span>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400">{phaseAngleA}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={phaseAngleA}
                  onChange={(e) => { setPhaseAngleA(Number(e.target.value)); resetTrajectory(); }}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
                />
              </div>

              {/* Phase B Phase Shift */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Phase B Shift (ϕ_B):</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{phaseAngleB}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={phaseAngleB}
                  onChange={(e) => { setPhaseAngleB(Number(e.target.value)); resetTrajectory(); }}
                  className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
                />
              </div>

              {/* Phase C Phase Shift */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Phase C Shift (ϕ_C):</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{phaseAngleC}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={phaseAngleC}
                  onChange={(e) => { setPhaseAngleC(Number(e.target.value)); resetTrajectory(); }}
                  className="w-full accent-amber-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Time Instant Scrub Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Instantaneous Time Angle (ωt):</span>
                <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">{Math.round(state.thetaDeg)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                step="1"
                value={state.thetaDeg}
                onChange={(e) => onUpdateState({ thetaDeg: Number(e.target.value) })}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Theoretical Explanation Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 text-xs space-y-2 transition-colors">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Mathematical Proof of Constant Rotating Field
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              When 3 windings displaced in space by <strong>120°</strong> carry balanced 3-phase currents displaced in time by <strong>120°</strong>, their instantaneous pulsating vectors sum to a single constant-magnitude rotating vector:
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200 space-y-1">
              <div>F_net(t) = i_a(t)·e^(j0°) + i_b(t)·e^(j120°) + i_c(t)·e^(j240°)</div>
              <div className="text-indigo-700 dark:text-indigo-400 font-bold">= (3/2) · I_m · e^(jωt)</div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              <strong>Try it:</strong> Change Phase B or C angle to observe the circular trajectory distort into an ellipse (unbalance), collapse into a line (pulsating field), or reverse direction!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
