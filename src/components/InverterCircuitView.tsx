import React from 'react';
import { SvpwmState } from '../types';
import { Zap, Activity, Info } from 'lucide-react';
import { useCardFullscreen } from '../hooks/useCardFullscreen';
import { FullscreenButton } from './FullscreenButton';

interface InverterCircuitViewProps {
  state: SvpwmState;
  darkMode?: boolean;
}

export const InverterCircuitView: React.FC<InverterCircuitViewProps> = ({ state, darkMode }) => {
  const [sa, sb, sc] = state.activeBits;

  // Voltages relative to DC negative rail (N)
  const vdc = state.vdc;
  const vaN = sa * vdc;
  const vbN = sb * vdc;
  const vcN = sc * vdc;

  // Line-to-line voltages
  const vab = vaN - vbN;
  const vbc = vbN - vcN;
  const vca = vcN - vaN;

  // Neutral voltage of balanced star load
  const vnN = (vaN + vbN + vcN) / 3;

  // Phase-to-neutral voltages
  const van = Math.round(vaN - vnN);
  const vbn = Math.round(vbN - vnN);
  const vcn = Math.round(vcN - vnN);

  const { isFullscreen, toggleFullscreen, cardRef } = useCardFullscreen();

  return (
    <div
      ref={cardRef}
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-white dark:bg-slate-950 p-6 sm:p-8 flex flex-col overflow-auto shadow-2xl'
          : 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col h-full'
      } transition-colors`}
    >
      {/* Title & Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
              3-Phase Inverter Live Conduction
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active semiconductors for Vector V{state.activeVectorId} [{sa} {sb} {sc}]
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400 dark:text-slate-500 block">DC Bus</span>
            <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{vdc} V</span>
          </div>
          <FullscreenButton isFullscreen={isFullscreen} onToggle={toggleFullscreen} />
        </div>
      </div>

      {/* Schematic SVG */}
      <div className={`relative flex-1 flex items-center justify-center my-3 ${isFullscreen ? 'min-h-[500px]' : 'min-h-[290px]'}`}>
        <svg viewBox="0 0 460 210" className={`w-full ${isFullscreen ? 'max-w-[900px]' : 'max-w-[620px]'} h-auto select-none font-sans drop-shadow-sm`}>
          {/* Top Rail (+Vdc) */}
          <line x1="40" y1="25" x2="350" y2="25" stroke="#ef4444" strokeWidth="2.5" />
          <text x="32" y="29" textAnchor="end" fill="#ef4444" fontSize="10" fontWeight="bold">
            +Vdc ({vdc}V)
          </text>

          {/* Bottom Rail (0V / DC-) */}
          <line x1="40" y1="185" x2="350" y2="185" stroke={darkMode ? '#475569' : '#334155'} strokeWidth="2.5" />
          <text x="32" y="189" textAnchor="end" fill={darkMode ? '#94a3b8' : '#334155'} fontSize="10" fontWeight="bold">
            0V (N)
          </text>

          {/* DC Link Capacitor */}
          <line x1="60" y1="25" x2="60" y2="95" stroke={darkMode ? '#475569' : '#64748b'} strokeWidth="1.5" />
          <line x1="60" y1="115" x2="60" y2="185" stroke={darkMode ? '#475569' : '#64748b'} strokeWidth="1.5" />
          <line x1="45" y1="95" x2="75" y2="95" stroke="#0284c7" strokeWidth="2.5" />
          <line x1="45" y1="115" x2="75" y2="115" stroke="#0284c7" strokeWidth="2.5" />
          <text x="78" y="109" fill="#0284c7" fontSize="9" fontWeight="bold">
            C_dc
          </text>

          {/* Helper to render an IGBT switch box */}
          {/* Leg X Coordinates: Leg A = 130, Leg B = 210, Leg C = 290 */}
          {[
            { leg: 'A', name: 'S1', x: 130, isTop: true, isOn: sa === 1, color: '#2563eb' },
            { leg: 'A', name: 'S4', x: 130, isTop: false, isOn: sa === 0, color: '#2563eb' },
            { leg: 'B', name: 'S3', x: 210, isTop: true, isOn: sb === 1, color: '#059669' },
            { leg: 'B', name: 'S6', x: 210, isTop: false, isOn: sb === 0, color: '#059669' },
            { leg: 'C', name: 'S5', x: 290, isTop: true, isOn: sc === 1, color: '#d97706' },
            { leg: 'C', name: 'S2', x: 290, isTop: false, isOn: sc === 0, color: '#d97706' },
          ].map((sw) => {
            const yCenter = sw.isTop ? 60 : 150;
            const yTop = sw.isTop ? 25 : 105;
            const yBot = sw.isTop ? 105 : 185;

            return (
              <g key={`sw-${sw.name}`}>
                {/* Connecting wire */}
                <line
                  x1={sw.x}
                  y1={yTop}
                  x2={sw.x}
                  y2={yBot}
                  stroke={sw.isOn ? '#10b981' : darkMode ? '#334155' : '#cbd5e1'}
                  strokeWidth={sw.isOn ? '2.5' : '1.5'}
                />

                {/* Switch body box */}
                <rect
                  x={sw.x - 16}
                  y={yCenter - 14}
                  width="32"
                  height="28"
                  rx="4"
                  fill={sw.isOn ? (darkMode ? '#064e3b' : '#ecfdf5') : (darkMode ? '#1e293b' : '#f8fafc')}
                  stroke={sw.isOn ? '#10b981' : darkMode ? '#475569' : '#94a3b8'}
                  strokeWidth={sw.isOn ? '2' : '1'}
                />

                {/* Switch Label */}
                <text
                  x={sw.x}
                  y={yCenter - 1}
                  textAnchor="middle"
                  fill={sw.isOn ? (darkMode ? '#6ee7b7' : '#047857') : (darkMode ? '#94a3b8' : '#64748b')}
                  fontSize="9.5"
                  fontWeight="bold"
                >
                  {sw.name}
                </text>

                {/* ON / OFF Indicator text */}
                <text
                  x={sw.x}
                  y={yCenter + 9}
                  textAnchor="middle"
                  fill={sw.isOn ? '#10b981' : (darkMode ? '#64748b' : '#94a3b8')}
                  fontSize="7.5"
                  fontWeight="bold"
                >
                  {sw.isOn ? 'ON' : 'OFF'}
                </text>
              </g>
            );
          })}

          {/* Leg Center Junctions & Output Wires leading to Motor */}
          {/* Leg A output */}
          <circle cx="130" cy="105" r="3.5" fill="#2563eb" />
          <line x1="130" y1="105" x2="350" y2="105" stroke="#2563eb" strokeWidth="2" />
          <text x="355" y="108" fill="#2563eb" fontSize="9.5" fontWeight="bold">
            Phase A
          </text>

          {/* Leg B output */}
          <circle cx="210" cy="105" r="3.5" fill="#059669" />
          <line x1="210" y1="105" x2="210" y2="120" stroke="#059669" strokeWidth="2" />
          <line x1="210" y1="120" x2="350" y2="120" stroke="#059669" strokeWidth="2" />
          <text x="355" y="123" fill="#059669" fontSize="9.5" fontWeight="bold">
            Phase B
          </text>

          {/* Leg C output */}
          <circle cx="290" cy="105" r="3.5" fill="#d97706" />
          <line x1="290" y1="105" x2="290" y2="135" stroke="#d97706" strokeWidth="2" />
          <line x1="290" y1="135" x2="350" y2="135" stroke="#d97706" strokeWidth="2" />
          <text x="355" y="138" fill="#d97706" fontSize="9.5" fontWeight="bold">
            Phase C
          </text>

          {/* Y-Connected 3-Phase Motor symbol on the right */}
          <rect
            x="400"
            y="90"
            width="52"
            height="55"
            rx="6"
            fill={darkMode ? '#1e293b' : '#f1f5f9'}
            stroke={darkMode ? '#475569' : '#64748b'}
            strokeWidth="1.5"
          />
          <text x="426" y="112" textAnchor="middle" fill={darkMode ? '#f8fafc' : '#1e293b'} fontSize="9" fontWeight="bold">
            3-Phase
          </text>
          <text x="426" y="124" textAnchor="middle" fill={darkMode ? '#94a3b8' : '#64748b'} fontSize="8" fontWeight="bold">
            AC Motor
          </text>
          <text x="426" y="136" textAnchor="middle" fill="#3b82f6" fontSize="8" fontWeight="bold">
            (Star Y)
          </text>
        </svg>
      </div>

      {/* Live Voltage Gauge Readouts */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        {/* Pole Voltages */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60">
          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
            Pole (Leg to DC-)
          </span>
          <div className="font-mono space-y-0.5 mt-1 font-semibold text-slate-800 dark:text-slate-200">
            <div className="text-blue-600 dark:text-blue-400">VaN = {vaN} V</div>
            <div className="text-emerald-600 dark:text-emerald-400">VbN = {vbN} V</div>
            <div className="text-amber-600 dark:text-amber-400">VcN = {vcN} V</div>
          </div>
        </div>

        {/* Line-to-Line Voltages */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60">
          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
            Line-to-Line
          </span>
          <div className="font-mono space-y-0.5 mt-1 font-semibold text-slate-800 dark:text-slate-200">
            <div className={vab > 0 ? 'text-emerald-600 dark:text-emerald-400' : vab < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}>
              Vab = {vab} V
            </div>
            <div className={vbc > 0 ? 'text-emerald-600 dark:text-emerald-400' : vbc < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}>
              Vbc = {vbc} V
            </div>
            <div className={vca > 0 ? 'text-emerald-600 dark:text-emerald-400' : vca < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}>
              Vca = {vca} V
            </div>
          </div>
        </div>

        {/* Phase-to-Neutral Voltages */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60">
          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
            Phase-to-Neutral
          </span>
          <div className="font-mono space-y-0.5 mt-1 font-semibold text-slate-800 dark:text-slate-200">
            <div className="text-blue-600 dark:text-blue-400">Van = {van} V</div>
            <div className="text-emerald-600 dark:text-emerald-400">Vbn = {vbn} V</div>
            <div className="text-amber-600 dark:text-amber-400">Vcn = {vcn} V</div>
          </div>
        </div>
      </div>
    </div>
  );
};
