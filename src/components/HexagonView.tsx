import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SvpwmState } from '../types';
import { SPACE_VECTORS } from '../utils/svpwm';
import { 
  Play, 
  Pause, 
  RotateCw, 
  ChevronRight, 
  ChevronLeft, 
  Target, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';

interface HexagonViewProps {
  state: SvpwmState;
  onUpdateState: (partial: Partial<SvpwmState>) => void;
}

export const HexagonView: React.FC<HexagonViewProps> = ({ state, onUpdateState }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showProjections, setShowProjections] = useState(true);
  const [showTrajectory, setShowTrajectory] = useState(true);

  // SVG Geometry Constants
  const viewBoxSize = 460;
  const center = viewBoxSize / 2;
  const hexRadius = 160; // Represents 2/3 * Vdc (Active vector length)
  const inscribedRadius = hexRadius * (Math.sqrt(3) / 2); // Linear modulation limit (m = 1.0)

  // Hexagon Vertices in Cartesian coordinates (0, 60, 120, 180, 240, 300 deg)
  const vertices = [
    { id: 1, angleDeg: 0, x: center + hexRadius, y: center, name: 'V1', bits: '100' },
    { id: 2, angleDeg: 60, x: center + hexRadius * 0.5, y: center - hexRadius * (Math.sqrt(3) / 2), name: 'V2', bits: '110' },
    { id: 3, angleDeg: 120, x: center - hexRadius * 0.5, y: center - hexRadius * (Math.sqrt(3) / 2), name: 'V3', bits: '010' },
    { id: 4, angleDeg: 180, x: center - hexRadius, y: center, name: 'V4', bits: '011' },
    { id: 5, angleDeg: 240, x: center - hexRadius * 0.5, y: center + hexRadius * (Math.sqrt(3) / 2), name: 'V5', bits: '001' },
    { id: 6, angleDeg: 300, x: center + hexRadius * 0.5, y: center + hexRadius * (Math.sqrt(3) / 2), name: 'V6', bits: '101' },
  ];

  // Polygon points for the outer hexagon
  const hexagonPoints = vertices.map(v => `${v.x},${v.y}`).join(' ');

  // Current V_ref vector position
  const vRefPixelRadius = (state.m * inscribedRadius);
  const vRefX = center + vRefPixelRadius * Math.cos(state.theta);
  const vRefY = center - vRefPixelRadius * Math.sin(state.theta); // Invert Y for SVG

  // Sector calculations for Volt-Second parallelogram projection
  const currentSector = state.sector;
  // Adjacent vectors for current sector:
  const v1Index = currentSector - 1; // 0..5
  const v2Index = currentSector % 6; // next vertex
  const vStart = vertices[v1Index];
  const vEnd = vertices[v2Index];

  // Projections on adjacent vectors according to dwell times
  const t1Ratio = Math.min(1, state.t1 / state.ts);
  const t2Ratio = Math.min(1, state.t2 / state.ts);

  // Projection points along adjacent active vectors:
  // Component along vStart: length = hexRadius * (t1/Ts * 2/√3) approx or based on dwell times
  const vStartAngleRad = (vStart.angleDeg * Math.PI) / 180;
  const vEndAngleRad = (vEnd.angleDeg * Math.PI) / 180;

  // Parallelogram vector components:
  // V_ref = V_x * (T1/Ts) + V_y * (T2/Ts)
  const proj1X = center + hexRadius * t1Ratio * Math.cos(vStartAngleRad);
  const proj1Y = center - hexRadius * t1Ratio * Math.sin(vStartAngleRad);

  const proj2X = center + hexRadius * t2Ratio * Math.cos(vEndAngleRad);
  const proj2Y = center - hexRadius * t2Ratio * Math.sin(vEndAngleRad);

  // Sector Pie paths for shading
  const sectorPaths = vertices.map((v, i) => {
    const nextV = vertices[(i + 1) % 6];
    return {
      sectorNumber: i + 1,
      d: `M ${center} ${center} L ${v.x} ${v.y} L ${nextV.x} ${nextV.y} Z`,
      midAngleDeg: i * 60 + 30,
    };
  });

  // Drag interaction handler
  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = -(e.clientY - rect.top - rect.height / 2); // Inverted Y

    const dist = Math.sqrt(x * x + y * y);
    const angle = Math.atan2(y, x);
    const normAngle = angle < 0 ? angle + 2 * Math.PI : angle;

    // Radius scale to modulation index m
    // scale: inscribedRadius on SVG corresponds to m = 1.0
    const calculatedM = Math.min(1.25, Math.max(0.05, (dist / (rect.width / viewBoxSize)) / inscribedRadius));

    onUpdateState({
      theta: normAngle,
      thetaDeg: Math.round((normAngle * 180) / Math.PI),
      m: Number(calculatedM.toFixed(2)),
      isPlaying: false, // pause when user manually drags
    });
  }, [isDragging, inscribedRadius, onUpdateState]);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(false);
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Step angle +/- 5 degrees
  const stepAngle = (deltaDeg: number) => {
    let newDeg = (state.thetaDeg + deltaDeg) % 360;
    if (newDeg < 0) newDeg += 360;
    const newRad = (newDeg * Math.PI) / 180;
    onUpdateState({
      theta: newRad,
      thetaDeg: newDeg,
      isPlaying: false,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col h-full">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              Complex αβ Space Vector Hexagon
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Sector {state.sector}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
              state.m <= 1.0 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : state.m <= 1.155 
                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {state.m <= 1.0 ? 'Linear Region' : state.m <= 1.155 ? 'Overmodulation I' : 'Six-Step Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Click or drag reference vector <span className="font-semibold text-rose-600">V_ref</span> inside the hexagon
          </p>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProjections(!showProjections)}
            className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
              showProjections 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            Volt-Sec Projections
          </button>
          <button
            onClick={() => setShowTrajectory(!showTrajectory)}
            className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
              showTrajectory 
                ? 'bg-sky-50 text-sky-700 border-sky-200' 
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            Trajectory
          </button>
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative flex-1 flex items-center justify-center my-2 min-h-[340px]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          className="w-full max-w-[420px] aspect-square select-none cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Definitions for Markers, Gradients & Filters */}
          <defs>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
            </marker>
            <marker
              id="arrow-ref"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
            </marker>
            <marker
              id="arrow-proj"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
            </marker>
            <radialGradient id="inscribedGrad" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#f8fafc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.7" />
            </radialGradient>
          </defs>

          {/* Coordinate Axes (Alpha - Beta) */}
          <line
            x1={center - hexRadius - 35}
            y1={center}
            x2={center + hexRadius + 35}
            y2={center}
            stroke="#cbd5e1"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <line
            x1={center}
            y1={center - hexRadius - 35}
            x2={center}
            y2={center + hexRadius + 35}
            stroke="#cbd5e1"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          {/* Axis Labels */}
          <text x={center + hexRadius + 26} y={center - 6} fill="#64748b" fontSize="11" fontWeight="bold">
            +α
          </text>
          <text x={center + 6} y={center - hexRadius - 20} fill="#64748b" fontSize="11" fontWeight="bold">
            +β
          </text>

          {/* Sector Shading Paths */}
          {sectorPaths.map((sp) => {
            const isCurrent = sp.sectorNumber === currentSector;
            return (
              <g key={`sector-${sp.sectorNumber}`}>
                <path
                  d={sp.d}
                  fill={isCurrent ? '#f0fdf4' : '#f8fafc'}
                  stroke={isCurrent ? '#86efac' : '#e2e8f0'}
                  strokeWidth={isCurrent ? '1.8' : '0.8'}
                  className="transition-colors duration-200"
                />
                {/* Sector Roman Numeral Label */}
                {(() => {
                  const rad = (sp.midAngleDeg * Math.PI) / 180;
                  const labelR = hexRadius * 0.45;
                  const lx = center + labelR * Math.cos(rad);
                  const ly = center - labelR * Math.sin(rad);
                  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI'];
                  return (
                    <text
                      x={lx}
                      y={ly + 4}
                      textAnchor="middle"
                      fill={isCurrent ? '#15803d' : '#94a3b8'}
                      fontSize={isCurrent ? '13' : '11'}
                      fontWeight={isCurrent ? 'bold' : '600'}
                    >
                      Sector {romans[sp.sectorNumber - 1]}
                    </text>
                  );
                })()}
              </g>
            );
          })}

          {/* Outer Hexagon Outline */}
          <polygon
            points={hexagonPoints}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Max Linear Modulation Inscribed Circle (radius = Vdc / sqrt(3)) */}
          <circle
            cx={center}
            cy={center}
            r={inscribedRadius}
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeDasharray="5 3"
          />
          <text
            x={center}
            y={center + inscribedRadius + 14}
            textAnchor="middle"
            fill="#0284c7"
            fontSize="9"
            fontWeight="bold"
          >
            Inscribed Limit (m = 1.0, Vdc/√3)
          </text>

          {/* Trajectory circular path */}
          {showTrajectory && (
            <circle
              cx={center}
              cy={center}
              r={vRefPixelRadius}
              fill="none"
              stroke="#fb7185"
              strokeWidth="1.2"
              strokeDasharray="2 3"
              opacity="0.8"
            />
          )}

          {/* 6 Active Vector Radial Arrows (V1..V6) */}
          {vertices.map((v) => {
            const isSectorBoundary = v.id === vStart.id || v.id === vEnd.id;
            return (
              <g key={`vector-${v.id}`}>
                <line
                  x1={center}
                  y1={center}
                  x2={v.x}
                  y2={v.y}
                  stroke={isSectorBoundary ? '#2563eb' : '#93c5fd'}
                  strokeWidth={isSectorBoundary ? '2.5' : '1.5'}
                  markerEnd="url(#arrow-active)"
                />
                {/* Vertex Badge */}
                <circle
                  cx={v.x}
                  cy={v.y}
                  r="13"
                  fill={isSectorBoundary ? '#2563eb' : '#ffffff'}
                  stroke={isSectorBoundary ? '#1d4ed8' : '#3b82f6'}
                  strokeWidth="2"
                />
                <text
                  x={v.x}
                  y={v.y + 3.5}
                  textAnchor="middle"
                  fill={isSectorBoundary ? '#ffffff' : '#1e3a8a'}
                  fontSize="9.5"
                  fontWeight="bold"
                >
                  {v.name}
                </text>
                {/* Binary State String [Sa Sb Sc] */}
                {(() => {
                  const rad = (v.angleDeg * Math.PI) / 180;
                  const bx = v.x + 22 * Math.cos(rad);
                  const by = v.y - 20 * Math.sin(rad) + 4;
                  return (
                    <text
                      x={bx}
                      y={by}
                      textAnchor="middle"
                      fill="#1e293b"
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {v.bits}
                    </text>
                  );
                })()}
              </g>
            );
          })}

          {/* Volt-Second Parallelogram Projections */}
          {showProjections && (
            <g>
              {/* Component along vStart */}
              <line
                x1={center}
                y1={center}
                x2={proj1X}
                y2={proj1Y}
                stroke="#6366f1"
                strokeWidth="2"
                markerEnd="url(#arrow-proj)"
              />
              {/* Component along vEnd */}
              <line
                x1={center}
                y1={center}
                x2={proj2X}
                y2={proj2Y}
                stroke="#6366f1"
                strokeWidth="2"
                markerEnd="url(#arrow-proj)"
              />
              {/* Dashed connector lines completing the parallelogram */}
              <line
                x1={proj1X}
                y1={proj1Y}
                x2={vRefX}
                y2={vRefY}
                stroke="#818cf8"
                strokeWidth="1.4"
                strokeDasharray="3 3"
              />
              <line
                x1={proj2X}
                y1={proj2Y}
                x2={vRefX}
                y2={vRefY}
                stroke="#818cf8"
                strokeWidth="1.4"
                strokeDasharray="3 3"
              />
            </g>
          )}

          {/* Angle arc for theta */}
          {(() => {
            const arcR = 38;
            const arcX = center + arcR * Math.cos(state.theta);
            const arcY = center - arcR * Math.sin(state.theta);
            const largeArcFlag = state.theta > Math.PI ? 1 : 0;
            return (
              <g>
                <path
                  d={`M ${center + arcR} ${center} A ${arcR} ${arcR} 0 ${largeArcFlag} 0 ${arcX} ${arcY}`}
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth="1.8"
                />
                <text
                  x={center + (arcR + 14) * Math.cos(state.theta / 2)}
                  y={center - (arcR + 14) * Math.sin(state.theta / 2)}
                  fill="#e11d48"
                  fontSize="10"
                  fontWeight="bold"
                >
                  θ={state.thetaDeg}°
                </text>
              </g>
            );
          })()}

          {/* Reference Space Vector V_ref */}
          <line
            x1={center}
            y1={center}
            x2={vRefX}
            y2={vRefY}
            stroke="#e11d48"
            strokeWidth="3.2"
            markerEnd="url(#arrow-ref)"
          />

          {/* Draggable V_ref handle */}
          <circle
            cx={vRefX}
            cy={vRefY}
            r="8"
            fill="#e11d48"
            stroke="#ffffff"
            strokeWidth="2.5"
            className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
          />
          <text
            x={vRefX + (vRefX >= center ? 12 : -28)}
            y={vRefY - 8}
            fill="#be123c"
            fontSize="11"
            fontWeight="bold"
          >
            V_ref
          </text>

          {/* Center Origin: V0 (000) and V7 (111) */}
          <circle cx={center} cy={center} r="6" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
          <text
            x={center}
            y={center + 18}
            textAnchor="middle"
            fill="#0f172a"
            fontSize="9"
            fontWeight="bold"
          >
            V0[000] / V7[111]
          </text>
        </svg>
      </div>

      {/* Real-time metrics bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
          <span className="text-slate-500 block">Angle θ</span>
          <span className="font-bold text-slate-800 text-sm">{state.thetaDeg}°</span>
          <span className="text-slate-400 block text-[10px]">{(state.theta).toFixed(2)} rad</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
          <span className="text-slate-500 block">Modulation Index m</span>
          <span className="font-bold text-indigo-700 text-sm">{state.m.toFixed(2)}</span>
          <span className="text-slate-400 block text-[10px]">|Vref| = {Math.round(state.vRefMag)} V</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
          <span className="text-slate-500 block">Dwell T1 ({vStart.name})</span>
          <span className="font-bold text-blue-700 text-sm">{((state.t1 / state.ts) * 100).toFixed(1)}%</span>
          <span className="text-slate-400 block text-[10px]">{(state.t1 * 1e6).toFixed(1)} µs</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
          <span className="text-slate-500 block">Dwell T2 ({vEnd.name})</span>
          <span className="font-bold text-emerald-700 text-sm">{((state.t2 / state.ts) * 100).toFixed(1)}%</span>
          <span className="text-slate-400 block text-[10px]">{(state.t2 * 1e6).toFixed(1)} µs</span>
        </div>
      </div>

      {/* Interactive Controls & Preset Buttons */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
        {/* Sliders row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Angle Scrub: {state.thetaDeg}°</span>
              <div className="flex gap-1">
                <button
                  onClick={() => stepAngle(-5)}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                  title="Step -5°"
                >
                  -5°
                </button>
                <button
                  onClick={() => stepAngle(5)}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                  title="Step +5°"
                >
                  +5°
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={state.thetaDeg}
              onChange={(e) => {
                const deg = Number(e.target.value);
                onUpdateState({
                  thetaDeg: deg,
                  theta: (deg * Math.PI) / 180,
                  isPlaying: false,
                });
              }}
              className="w-full accent-rose-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Modulation Index (m): {state.m.toFixed(2)}</span>
              <span className="text-slate-400 font-normal">Max Linear: 1.00</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.25"
              step="0.01"
              value={state.m}
              onChange={(e) => onUpdateState({ m: Number(e.target.value) })}
              className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Quick Presets for Students */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-xs text-slate-500 font-medium mr-1">Presets:</span>
          <button
            onClick={() => onUpdateState({ m: 0.5, isPlaying: true })}
            className={`px-2 py-1 rounded text-xs border font-medium transition-colors ${
              state.m === 0.5 
                ? 'bg-sky-600 text-white border-sky-600' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Low (m = 0.5)
          </button>
          <button
            onClick={() => onUpdateState({ m: 0.85, isPlaying: true })}
            className={`px-2 py-1 rounded text-xs border font-medium transition-colors ${
              state.m === 0.85 
                ? 'bg-sky-600 text-white border-sky-600' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Nominal (m = 0.85)
          </button>
          <button
            onClick={() => onUpdateState({ m: 1.0, isPlaying: true })}
            className={`px-2 py-1 rounded text-xs border font-medium transition-colors ${
              state.m === 1.0 
                ? 'bg-sky-600 text-white border-sky-600' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Max Linear (m = 1.0)
          </button>
          <button
            onClick={() => onUpdateState({ m: 1.12, isPlaying: true })}
            className={`px-2 py-1 rounded text-xs border font-medium transition-colors ${
              state.m === 1.12 
                ? 'bg-sky-600 text-white border-sky-600' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Overmod I (m = 1.12)
          </button>
          <button
            onClick={() => onUpdateState({ m: 1.25, isPlaying: true })}
            className={`px-2 py-1 rounded text-xs border font-medium transition-colors ${
              state.m === 1.25 
                ? 'bg-sky-600 text-white border-sky-600' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Six-Step (m = 1.25)
          </button>
        </div>
      </div>
    </div>
  );
};
