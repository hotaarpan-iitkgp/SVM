import React from 'react';
import { SvpwmState } from '../types';
import { Binary, Calculator, Check, ArrowRight, BookOpen } from 'lucide-react';

interface FormulaInspectorProps {
  state: SvpwmState;
}

export const FormulaInspector: React.FC<FormulaInspectorProps> = ({ state }) => {
  const normTheta = state.theta % (2 * Math.PI);
  const alphaDeg = Math.round(((normTheta - (state.sector - 1) * (Math.PI / 3)) * 180) / Math.PI);
  const tsUs = (state.ts * 1e6).toFixed(1);
  const t1Us = (state.t1 * 1e6).toFixed(1);
  const t2Us = (state.t2 * 1e6).toFixed(1);
  const t0Us = (state.t0 * 1e6).toFixed(1);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-6 transition-colors">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calculator className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Live Mathematical Derivations & Calculations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time numerical evaluation of Clarke transformation, dwell times, and zero-sequence equations
          </p>
        </div>
        <div className="text-xs font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-md border border-indigo-200 dark:border-indigo-800">
          θ = {state.thetaDeg}° • Sector {state.sector} • m = {state.m.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1: Clarke Transformation */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Stationary Frame (αβ)
            </span>
            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">Clarke Projection</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Converts 3-phase references into orthogonal stationary coordinates:
          </p>
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 space-y-1">
            <div>V_ref = m · (Vdc / √3) = {state.m.toFixed(2)} · ({state.vdc} / 1.732) = <strong className="text-indigo-600 dark:text-indigo-400">{Math.round(state.vRefMag)} V</strong></div>
            <div>Vα = |V_ref| · cos({state.thetaDeg}°) = <strong className="text-slate-900 dark:text-white">{Math.round(state.vAlpha)} V</strong></div>
            <div>Vβ = |V_ref| · sin({state.thetaDeg}°) = <strong className="text-slate-900 dark:text-white">{Math.round(state.vBeta)} V</strong></div>
          </div>
        </div>

        {/* Step 2: Sector Identification */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Sector Identification
            </span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Hexagon Partition</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Determined by reference vector angle θ in 60° increments:
          </p>
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 space-y-1">
            <div>Sector = ⌊θ / 60°⌋ + 1 = ⌊{state.thetaDeg}° / 60°⌋ + 1 = <strong className="text-emerald-600 dark:text-emerald-400">Sector {state.sector}</strong></div>
            <div>Sector span: [{(state.sector - 1) * 60}°, {state.sector * 60}°]</div>
            <div>Angle in sector (α): {state.thetaDeg}° - {(state.sector - 1) * 60}° = <strong className="text-slate-900 dark:text-white">{alphaDeg}°</strong></div>
          </div>
        </div>

        {/* Step 3: Volt-Second Balance Dwell Times */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              3. Volt-Second Dwell Times
            </span>
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">Ts = {tsUs} µs</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Active vectors time durations T1 and T2 + Zero vector time T0:
          </p>
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 space-y-1">
            <div>T1 = m · Ts · sin(60° - α) = <strong className="text-blue-600 dark:text-blue-400">{t1Us} µs</strong> ({((state.t1 / state.ts) * 100).toFixed(1)}%)</div>
            <div>T2 = m · Ts · sin(α) = <strong className="text-emerald-600 dark:text-emerald-400">{t2Us} µs</strong> ({((state.t2 / state.ts) * 100).toFixed(1)}%)</div>
            <div>T0 = Ts - (T1 + T2) = <strong className="text-amber-600 dark:text-amber-400">{t0Us} µs</strong> ({((state.t0 / state.ts) * 100).toFixed(1)}%)</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Split: T(000) = {(state.t000 * 1e6).toFixed(1)} µs, T(111) = {(state.t111 * 1e6).toFixed(1)} µs</div>
          </div>
        </div>

        {/* Step 4: Leg Duty Cycles (Carrier Compare Values) */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              4. Inverter Leg Duty Cycles
            </span>
            <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-semibold">Center-Aligned Compare</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Compare values fed to micro-controller PWM timers (0.0 to 1.0):
          </p>
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 space-y-1">
            <div>Leg A Duty (Da) = <strong className="text-blue-600 dark:text-blue-400">{(state.da * 100).toFixed(1)}%</strong> ({state.da.toFixed(3)})</div>
            <div>Leg B Duty (Db) = <strong className="text-emerald-600 dark:text-emerald-400">{(state.db * 100).toFixed(1)}%</strong> ({state.db.toFixed(3)})</div>
            <div>Leg C Duty (Dc) = <strong className="text-amber-600 dark:text-amber-400">{(state.dc * 100).toFixed(1)}%</strong> ({state.dc.toFixed(3)})</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Ta = {(state.da * state.ts * 1e6).toFixed(1)} µs, Tb = {(state.db * state.ts * 1e6).toFixed(1)} µs, Tc = {(state.dc * state.ts * 1e6).toFixed(1)} µs</div>
          </div>
        </div>
      </div>

      {/* Carrier-Based Equivalence Theorem Box */}
      <div className="p-4 rounded-xl bg-linear-to-r from-indigo-50/80 to-sky-50/80 dark:from-indigo-950/40 dark:to-sky-950/40 border border-indigo-100 dark:border-indigo-900/60">
        <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          The Carrier-Based Equivalence Theorem (Zero-Sequence Injection)
        </h3>
        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
          Instead of computing complex trigonometrics in polar space, modern DSPs and microcontrollers can implement SVPWM identically using carrier PWM by injecting a zero-sequence offset:
        </p>
        <div className="mt-2 p-2.5 rounded bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-800 font-mono text-xs text-indigo-900 dark:text-indigo-200">
          V_offset = -0.5 · [ max(Va, Vb, Vc) + min(Va, Vb, Vc) ]
          <br />
          Va* = Va + V_offset, &nbsp; Vb* = Vb + V_offset, &nbsp; Vc* = Vc + V_offset
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2">
          When Va*, Vb*, Vc* are normalized to the carrier range [0, 1], they yield the <strong>exact same duty cycles</strong> Da, Db, Dc as calculated above by the Space Vector volt-second equations!
        </p>
      </div>
    </div>
  );
};
