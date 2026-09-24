import React, { useState, useMemo } from 'react';
import { SvpwmState } from '../types';
import { 
  Network, 
  Layers, 
  Compass, 
  Zap, 
  RotateCw, 
  CheckCircle2, 
  Sliders, 
  Activity, 
  ShieldCheck, 
  Info,
  ChevronRight,
  Play,
  Pause,
  ChevronLeft
} from 'lucide-react';

interface MultilevelSvmViewProps {
  state: SvpwmState;
  onUpdateState: (partial: Partial<SvpwmState>) => void;
}

interface LatticeVector {
  id: string;
  alpha: number; // normalized [-1, 1]
  beta: number; // normalized [-1, 1]
  states: string[];
  mag: number;
  type: 'zero' | 'small' | 'medium' | 'large' | 'inner';
}

export const MultilevelSvmView: React.FC<MultilevelSvmViewProps> = ({ state, onUpdateState }) => {
  // Configurable inverter levels: 2, 3, 4, 5, 6
  const [level, setLevel] = useState<number>(3);
  const [smallVectorChoice, setSmallVectorChoice] = useState<'p-type' | 'n-type' | 'balanced'>('balanced');
  const [showSubTriangles, setShowSubTriangles] = useState(true);
  const [showStateLabels, setShowStateLabels] = useState(false);

  // SVG Geometry Constants
  const R = 155; // outer radius scale in pixels
  const cx = 220;
  const cy = 205;

  // Real-time rotating angle and modulation index from central state
  const theta = state.theta;
  const thetaDeg = state.thetaDeg;
  const m = state.m;

  // Normalized reference vector tip in alpha-beta:
  // In linear modulation, maximum radius is sqrt(3)/2 ~ 0.866
  const vRefRadiusNorm = m * (Math.sqrt(3) / 2);
  const vRefAlpha = vRefRadiusNorm * Math.cos(theta);
  const vRefBeta = vRefRadiusNorm * Math.sin(theta);

  const vRefX = cx + vRefAlpha * R;
  const vRefY = cy - vRefBeta * R;

  // Generate Generalized Multilevel Space Vector Lattice for N levels
  const { vectors, nearest3, stats } = useMemo(() => {
    const N = level;
    const map = new Map<string, { alpha: number; beta: number; states: string[] }>();

    // Step size between discrete voltage levels:
    // Switching indices Sa, Sb, Sc in {0, 1, ..., N-1}
    for (let sa = 0; sa < N; sa++) {
      for (let sb = 0; sb < N; sb++) {
        for (let sc = 0; sc < N; sc++) {
          // Clarke transform normalized such that outer vector magnitude = 1.0:
          // Maximum Sa - 0.5(Sb+Sc) = N-1, scaled by 1/(N-1)
          const valAlpha = (sa - 0.5 * (sb + sc)) / (N - 1);
          const valBeta = ((Math.sqrt(3) / 2) * (sb - sc)) / (N - 1);

          // Key for grouping redundant switching states
          const key = `${valAlpha.toFixed(4)},${valBeta.toFixed(4)}`;

          // Format state label
          let stateLabel: string;
          if (N === 2) {
            stateLabel = `${sa}${sb}${sc}`;
          } else if (N === 3) {
            const sym = ['N', 'O', 'P'];
            stateLabel = `${sym[sa]}${sym[sb]}${sym[sc]}`;
          } else {
            stateLabel = `${sa}${sb}${sc}`;
          }

          if (!map.has(key)) {
            map.set(key, { alpha: valAlpha, beta: valBeta, states: [stateLabel] });
          } else {
            map.get(key)!.states.push(stateLabel);
          }
        }
      }
    }

    // Convert map to vector list
    const vectorList: LatticeVector[] = [];
    let idCounter = 1;

    map.forEach((val) => {
      const mag = Math.sqrt(val.alpha * val.alpha + val.beta * val.beta);
      let type: LatticeVector['type'] = 'inner';

      if (mag < 0.001) {
        type = 'zero';
      } else if (Math.abs(mag - 1.0) < 0.02) {
        type = 'large';
      } else if (Math.abs(mag - Math.sqrt(3) / 2) < 0.02) {
        type = 'medium';
      } else if (mag <= 0.55) {
        type = 'small';
      }

      vectorList.push({
        id: `V${idCounter++}`,
        alpha: val.alpha,
        beta: val.beta,
        states: val.states,
        mag,
        type,
      });
    });

    // Sub-triangles count: 6 * (N - 1)^2
    const numTriangles = 6 * (N - 1) * (N - 1);
    const numVectors = 3 * N * (N - 1) + 1;
    const numStates = N * N * N;

    // Find the 3 nearest vectors to V_ref (Nearest Three Vectors - NTV)
    // Sort all vectors by distance to (vRefAlpha, vRefBeta)
    const sortedByDist = [...vectorList].sort((a, b) => {
      const da = Math.hypot(a.alpha - vRefAlpha, a.beta - vRefBeta);
      const db = Math.hypot(b.alpha - vRefAlpha, b.beta - vRefBeta);
      return da - db;
    });

    const nearest3 = sortedByDist.slice(0, 3);

    return {
      vectors: vectorList,
      nearest3,
      stats: {
        numStates,
        numVectors,
        numTriangles,
        levels: N,
        lineLevels: 2 * N - 1,
      },
    };
  }, [level, vRefAlpha, vRefBeta]);

  // Major sector (1..6)
  const normDeg = ((thetaDeg % 360) + 360) % 360;
  const majorSector = Math.min(6, Math.floor(normDeg / 60) + 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 transition-colors">
      {/* Overview Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Multilevel Space Vector Modulation ({level}-Level Inverter)
                </h1>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {stats.numStates} Switching States • {stats.numVectors} Voltage Vectors
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {level === 2 && 'Standard 2-Level VSI • 6 Active Vectors • 1 Zero Vector'}
                {level === 3 && '3-Level NPC / T-Type • 24 Sub-Triangles • 5-Level Line Voltages'}
                {level === 4 && '4-Level Flying Capacitor (FC) • 54 Sub-Triangles • 7-Level Line Voltages'}
                {level === 5 && '5-Level Cascaded H-Bridge (CHB) • 96 Sub-Triangles • 9-Level Line Voltages'}
                {level > 5 && `${level}-Level High-Voltage Inverter • ${stats.numTriangles} Sub-Triangles`}
              </p>
            </div>
          </div>

          {/* Real-time Rotation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateState({ isPlaying: !state.isPlaying })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white shadow-xs transition-colors ${
                state.isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {state.isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5 fill-current" />
                  <span>Pause Rotation</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Rotate Vector</span>
                </>
              )}
            </button>

            {/* Step Controls */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => {
                  const newDeg = (state.thetaDeg - 5 + 360) % 360;
                  onUpdateState({ thetaDeg: newDeg, isPlaying: false });
                }}
                className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700"
                title="Step backward 5°"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="font-mono px-1 font-bold text-slate-800 dark:text-slate-200">{Math.round(state.thetaDeg)}°</span>
              <button
                onClick={() => {
                  const newDeg = (state.thetaDeg + 5) % 360;
                  onUpdateState({ thetaDeg: newDeg, isPlaying: false });
                }}
                className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700"
                title="Step forward 5°"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Level Selection Bar to choose any number of levels */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Inverter Level (N):
            </span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {[2, 3, 4, 5].map((lvl) => (
                <button
                  key={`lvl-btn-${lvl}`}
                  onClick={() => setLevel(lvl)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    level === lvl
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lvl}-Level {lvl === 2 ? '(2-L)' : lvl === 3 ? '(NPC)' : lvl === 4 ? '(FC)' : '(CHB)'}
                </button>
              ))}
            </div>

            {/* Slider for arbitrary level count */}
            <div className="flex items-center gap-1.5 ml-2">
              <input
                type="range"
                min="2"
                max="6"
                step="1"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-20 accent-emerald-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
              />
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{level} Levels</span>
            </div>
          </div>

          {/* Quick modulation and angle sliders */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Angle θ:</span>
              <input
                type="range"
                min="0"
                max="359"
                step="1"
                value={state.thetaDeg}
                onChange={(e) => onUpdateState({ thetaDeg: Number(e.target.value) })}
                className="w-24 accent-emerald-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
              />
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-9 text-right">{Math.round(state.thetaDeg)}°</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Index m:</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.02"
                value={state.m}
                onChange={(e) => onUpdateState({ m: Number(e.target.value) })}
                className="w-20 accent-emerald-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
              />
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 w-9 text-right">{state.m.toFixed(2)}</span>
            </div>

            <label className="flex items-center gap-1 cursor-pointer text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showSubTriangles}
                onChange={(e) => setShowSubTriangles(e.target.checked)}
                className="rounded text-emerald-600 accent-emerald-600"
              />
              <span>Grid Lines</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Multi-Level Canvas & Synthesis Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Multi-Level Hexagon Canvas */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col items-center transition-colors">
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                {level}-Level Space Vector Hexagonal Lattice ({stats.numTriangles} Sub-Triangles)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {level - 1} Concentric Hexagons • Real-Time Rotating Reference Vector V_ref
              </p>
            </div>

            <span className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold">
              Sector {majorSector} • θ={Math.round(thetaDeg)}°
            </span>
          </div>

          {/* SVG Canvas */}
          <div className="relative flex-1 w-full my-2 min-h-[410px] flex items-center justify-center">
            <svg viewBox="0 0 440 410" className="w-full max-w-[440px] h-auto select-none font-sans">
              {/* Outer and Concentric Hexagons */}
              {Array.from({ length: level - 1 }, (_, idx) => {
                const k = (idx + 1) / (level - 1); // 1/(N-1) .. 1.0
                const pts = [0, 1, 2, 3, 4, 5].map((i) => {
                  const a = (i * Math.PI) / 3;
                  return `${cx + k * R * Math.cos(a)},${cy - k * R * Math.sin(a)}`;
                }).join(' ');

                return (
                  <polygon
                    key={`hex-ring-${idx}`}
                    points={pts}
                    fill={idx === level - 2 ? '#f8fafc' : 'none'}
                    stroke={idx === level - 2 ? '#cbd5e1' : '#e2e8f0'}
                    strokeWidth={idx === level - 2 ? '1.8' : '1'}
                    strokeDasharray={idx === level - 2 ? 'none' : '3 2'}
                  />
                );
              })}

              {/* Equilateral Sub-Triangle Mesh Grid Lines */}
              {showSubTriangles && (
                <g stroke="#e2e8f0" strokeWidth="0.8" opacity="0.85">
                  {/* Radial sector boundary lines */}
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const a = (i * Math.PI) / 3;
                    return (
                      <line
                        key={`radial-line-${i}`}
                        x1={cx}
                        y1={cy}
                        x2={cx + R * Math.cos(a)}
                        y2={cy - R * Math.sin(a)}
                        stroke="#cbd5e1"
                        strokeWidth="1.2"
                      />
                    );
                  })}

                  {/* Connect adjacent vectors with equilateral triangle edges */}
                  {vectors.map((v1, i) => {
                    // Find neighbors within grid step distance
                    const stepDist = 1 / (level - 1);
                    return vectors.slice(i + 1).map((v2, j) => {
                      const d = Math.hypot(v1.alpha - v2.alpha, v1.beta - v2.beta);
                      if (Math.abs(d - stepDist) < 0.04) {
                        return (
                          <line
                            key={`tri-edge-${i}-${j}`}
                            x1={cx + v1.alpha * R}
                            y1={cy - v1.beta * R}
                            x2={cx + v2.alpha * R}
                            y2={cy - v2.beta * R}
                            stroke="#e2e8f0"
                          />
                        );
                      }
                      return null;
                    });
                  })}
                </g>
              )}

              {/* Active Sub-Triangle Highlight (Nearest 3 Vectors) */}
              {nearest3.length === 3 && (
                <polygon
                  points={`${cx + nearest3[0].alpha * R},${cy - nearest3[0].beta * R} ${cx + nearest3[1].alpha * R},${cy - nearest3[1].beta * R} ${cx + nearest3[2].alpha * R},${cy - nearest3[2].beta * R}`}
                  fill="#d1fae5"
                  fillOpacity="0.65"
                  stroke="#10b981"
                  strokeWidth="1.8"
                />
              )}

              {/* Reference Vector Trajectory Circle */}
              <circle
                cx={cx}
                cy={cy}
                r={vRefRadiusNorm * R}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                opacity="0.6"
              />

              {/* Live Rotating Reference Vector Arrow */}
              <line
                x1={cx}
                y1={cy}
                x2={vRefX}
                y2={vRefY}
                stroke="#047857"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <circle cx={vRefX} cy={vRefY} r="4.5" fill="#047857" />
              <text
                x={vRefX + 8}
                y={vRefY - 6}
                fill="#047857"
                fontSize="11"
                fontWeight="bold"
              >
                V_ref ({Math.round(thetaDeg)}°)
              </text>

              {/* Vector Nodes Rendering */}
              {vectors.map((vec) => {
                const vx = cx + vec.alpha * R;
                const vy = cy - vec.beta * R;

                const isNearest = nearest3.some((n) => n.id === vec.id);

                let nodeFill = '#64748b';
                let nodeR = level > 4 ? 2.5 : 3.5;
                if (vec.type === 'large') {
                  nodeFill = '#2563eb';
                  nodeR = level > 4 ? 4 : 5;
                } else if (vec.type === 'medium') {
                  nodeFill = '#d97706';
                  nodeR = level > 4 ? 3.5 : 4.5;
                } else if (vec.type === 'small') {
                  nodeFill = '#059669';
                  nodeR = level > 4 ? 3 : 4;
                } else if (vec.type === 'zero') {
                  nodeFill = '#0f172a';
                  nodeR = level > 4 ? 4 : 5;
                }

                if (isNearest) {
                  nodeFill = '#10b981';
                  nodeR = 6;
                }

                return (
                  <g key={`ml-node-${vec.id}`}>
                    <circle
                      cx={vx}
                      cy={vy}
                      r={nodeR}
                      fill={nodeFill}
                      stroke={isNearest ? '#ffffff' : 'none'}
                      strokeWidth={isNearest ? '1.5' : '0'}
                    />
                    {/* Node redundancy badge on small or medium levels */}
                    {level <= 3 && vec.states.length > 1 && (
                      <text
                        x={vx}
                        y={vy - 6}
                        textAnchor="middle"
                        fill="#059669"
                        fontSize="7.5"
                        fontWeight="bold"
                      >
                        ×{vec.states.length}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Center Origin Dot */}
              <circle cx={cx} cy={cy} r="3" fill="#ffffff" />
            </svg>
          </div>

          {/* Quick Sub-Triangle Legend */}
          <div className="w-full flex items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Large (1.0)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" /> Medium (0.866)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Small (0.5)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block" /> Zero (0)
              </span>
            </div>
            <span className="text-emerald-700 font-bold font-mono">
              Active Triangle: {nearest3.map((n) => n.id).join(' - ')}
            </span>
          </div>
        </div>

        {/* Right: Synthesis Details & Multilevel Metrics */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Sub-Triangle Synthesis Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Nearest Three Vectors (NTV) Synthesis
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                {level}-Level NTV
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              In multilevel SVPWM, the reference vector V_ref is synthesized exclusively by the <strong>3 vertices of the sub-triangle</strong> containing it, minimizing switching ripple and dv/dt:
            </p>

            {/* 3 Synthesizing Vectors Cards */}
            <div className="space-y-2">
              {nearest3.map((vec, idx) => (
                <div key={`near-${vec.id}`} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-[11px]">
                      V{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{vec.id}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] ml-1.5">Mag: {vec.mag.toFixed(3)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-slate-700 dark:text-slate-200 text-[11px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      [{vec.states.slice(0, 3).join(', ')}{vec.states.length > 3 ? '...' : ''}]
                    </span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {vec.states.length} redundant state{vec.states.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Inverter Topology Metrics Table */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
                {level}-Level Inverter Mathematical Scaling:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-sans">Switching States (N³)</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{stats.numStates} States</span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-sans">Unique Vectors</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{stats.numVectors} Vectors</span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-sans">Sub-Triangles [6(N-1)²]</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{stats.numTriangles} Triangles</span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-sans">Line Voltage Steps</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">{stats.lineLevels} Levels</span>
                </div>
              </div>
            </div>
          </div>

          {/* Advantages Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 text-xs space-y-2 transition-colors">
            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Why Multilevel Modulation?
            </h4>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Reduced dv/dt Stress:</strong> Each switch transition handles only Vdc / {level - 1} V rather than full Vdc.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Substantially Lower THD:</strong> Harmonic energy shifts to much higher frequencies, drastically reducing required filter size.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Switching State Redundancy:</strong> Multiple redundant states allow active balancing of DC-link midpoint capacitor voltages.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
