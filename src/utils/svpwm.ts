/**
 * Space Vector Modulation (SVPWM) Mathematical and Physics Engine.
 */

import { SpaceVector, SvpwmState } from '../types';

export const SPACE_VECTORS: SpaceVector[] = [
  { id: 0, name: 'V0', bits: [0, 0, 0], angleDeg: 0, magnitude: 0, label: '000 (Null)' },
  { id: 1, name: 'V1', bits: [1, 0, 0], angleDeg: 0, magnitude: 2 / 3, label: '100 (0°)' },
  { id: 2, name: 'V2', bits: [1, 1, 0], angleDeg: 60, magnitude: 2 / 3, label: '110 (60°)' },
  { id: 3, name: 'V3', bits: [0, 1, 0], angleDeg: 120, magnitude: 2 / 3, label: '010 (120°)' },
  { id: 4, name: 'V4', bits: [0, 1, 1], angleDeg: 180, magnitude: 2 / 3, label: '011 (180°)' },
  { id: 5, name: 'V5', bits: [0, 0, 1], angleDeg: 240, magnitude: 2 / 3, label: '001 (240°)' },
  { id: 6, name: 'V6', bits: [1, 0, 1], angleDeg: 300, magnitude: 2 / 3, label: '101 (300°)' },
  { id: 7, name: 'V7', bits: [1, 1, 1], angleDeg: 0, magnitude: 0, label: '111 (Null)' },
];

/** Map [Sa, Sb, Sc] to vector ID 0..7 */
export function bitsToVectorId(bits: [number, number, number]): number {
  const [a, b, c] = bits;
  if (a === 0 && b === 0 && c === 0) return 0;
  if (a === 1 && b === 0 && c === 0) return 1;
  if (a === 1 && b === 1 && c === 0) return 2;
  if (a === 0 && b === 1 && c === 0) return 3;
  if (a === 0 && b === 1 && c === 1) return 4;
  if (a === 0 && b === 0 && c === 1) return 5;
  if (a === 1 && b === 0 && c === 1) return 6;
  if (a === 1 && b === 1 && c === 1) return 7;
  return 0;
}

/** Given theta in [0, 2*PI), determine sector (1..6) */
export function getSector(theta: number): number {
  let normalized = theta % (2 * Math.PI);
  if (normalized < 0) normalized += 2 * Math.PI;
  const sector = Math.floor(normalized / (Math.PI / 3)) + 1;
  return Math.min(Math.max(sector, 1), 6);
}

/**
 * Segment definition for 7-segment center-aligned SVPWM.
 */
export interface SvpwmSegment {
  id: number;
  name: string;
  bits: [number, number, number];
  bitsStr: string;
  duration: number; // in seconds
  tStart: number; // 0..1 normalized
  tEnd: number; // 0..1 normalized
  label: string;
}

/**
 * Returns the 7-segment sequence for the given sector in chronological order.
 * In any sector, exactly one inverter leg transitions at each step.
 */
export function getSectorSequence(sector: number): {
  id: number;
  name: string;
  bits: [number, number, number];
  bitsStr: string;
  labelKey: 'T0/4' | 'T1/2' | 'T2/2' | 'T7/2';
  timeKey: 't0_4' | 't1_2' | 't2_2' | 't7_2';
}[] {
  switch (sector) {
    case 1:
      // V0(000) -> V1(100) -> V2(110) -> V7(111) -> V2(110) -> V1(100) -> V0(000)
      return [
        { id: 0, name: 'V0', bits: [0, 0, 0], bitsStr: '000', labelKey: 'T0/4', timeKey: 't0_4' },
        { id: 1, name: 'V1', bits: [1, 0, 0], bitsStr: '100', labelKey: 'T1/2', timeKey: 't1_2' },
        { id: 2, name: 'V2', bits: [1, 1, 0], bitsStr: '110', labelKey: 'T2/2', timeKey: 't2_2' },
        { id: 7, name: 'V7', bits: [1, 1, 1], bitsStr: '111', labelKey: 'T7/2', timeKey: 't7_2' },
        { id: 2, name: 'V2', bits: [1, 1, 0], bitsStr: '110', labelKey: 'T2/2', timeKey: 't2_2' },
        { id: 1, name: 'V1', bits: [1, 0, 0], bitsStr: '100', labelKey: 'T1/2', timeKey: 't1_2' },
        { id: 0, name: 'V0', bits: [0, 0, 0], bitsStr: '000', labelKey: 'T0/4', timeKey: 't0_4' },
      ];
    case 2:
      // V0(000) -> V3(010) [T2/2] -> V2(110) [T1/2] -> V7(111) -> V2(110) -> V3(010) -> V0(000)
      return [
        { id: 0, name: 'V0', bits: [0, 0, 0], bitsStr: '000', labelKey: 'T0/4', timeKey: 't0_4' },
        { id: 3, name: 'V3', bits: [0, 1, 0], bitsStr: '010', labelKey: 'T2/2', timeKey: 't2_2' },
        { id: 2, name: 'V2', bits: [1, 1, 0], bitsStr: '110', labelKey: 'T1/2', timeKey: 't1_2' },
        { id: 7, name: 'V7', bits: [1, 1, 1], bitsStr: '111', labelKey: 'T7/2', timeKey: 't7_2' },
        { id: 2, name: 'V2', bits: [1, 1, 0], bitsStr: '110', labelKey: 'T1/2', timeKey: 't1_2' },
        { id: 3, name: 'V3', bits: [0, 1, 0], bitsStr: '010', labelKey: 'T2/2', timeKey: 't2_2' },
        { id: 0, name: 'V0', bits: [0, 0, 0], bitsStr: '000', labelKey: 'T0/4', timeKey: 't0_4' },
      ];
    case 3:
      // V0(000) -> V3(010) -> V4(011) -> V7(111) -> V4(011) -> V3(010) -> V0(000)
      return [
        { id: 0, name: 'V0', bits: [0, 0, 0], bitsStr: '000', labelKey: 'T0/4', timeKey: 't0_4' },
        { id: 3, name: 'V3', bits: [0, 1, 0], bitsStr: '010', labelKey: 'T1/2', timeKey: 't1_2' },
        { id: 4, name: 'V4', bits: [0, 1, 1], bitsStr: '011', labelKey: 'T2/2', timeKey: 't2_2' },
        { id: 7, name: 'V7', bits: [1, 1, 1], bitsStr: '111', labelKey: 'T7/2', timeKey: 't7_2' },
        { id: 4, name: 'V4', bits: [0, 1, 1], bitsStr: '011', labelKey: 'T2/2', timeKey: 't2_2' },
        { id: 3, name: 'V3', bits: [0, 1, 0], bitsStr: '010', labelKey: 'T1/2', timeKey: 't1_2' },
        { id: 0, name: 'V0', bits: [0, 0, 0], bitsStr: '000', labelKey: 'T0/4', timeKey: 't0_4' },
      ];
    case 4:
      // V0(000) -> V5(001) [T2/2] -> V4(011) [T1/2] -> V7(111) -> V4(011) -> V5(001) -> V0(000)
      return [
        { id: 0, name: 'V0', bits: [0, 0, 0], bitsStr: '000', labelKey: 'T0/4', timeKey: 't0_4' },
        { id: 5, name: 'V5', bits: [0, 0, 1], bitsStr: '001', labelKey: 'T2/2', timeKey: 't2_2' },
        { id: 4, name: 'V4', bits: [0, 1, 1], bitsStr: '011', labelKey: 'T1/2', timeKey: 't1_2' },
        { id: 7, name: 'V7', bits: [1, 1, 1], bitsStr: '111', labelKey: 'T7/2', timeKey: 't7_2' },
        { id: 4, name: 'V4', bits: [0, 1, 1], bitsStr: '011', labelKey: 'T1/2', timeKey: 't1_2' },
        { id: 5, name: 'V5', bits: [0, 0, 1], bitsStr: '001', labelKey: 'T2/2', timeKey: 't2_2' },
        { id: 0, name: 'V0', bits: [0, 0, 0], bitsStr: '000', labelKey: 'T0/4', timeKey: 't0_4' },
      ];
    case 5:
      // V0(000) -> V5(001) -> V6(101) -> V7(111) -> V6(101) -> V5(001) -> V0(000)
      return [
        { id: 0, name: 'V0', bits: [0, 0, 0], bitsStr: '000', labelKey: 'T0/4', timeKey: 't0_4' },
        { id: 5, name: 'V5', bits: [0, 0, 1], bitsStr: '001', labelKey: 'T1/2', timeKey: 't1_2' },
        { id: 6, name: 'V6', bits: [1, 0, 1], bitsStr: '101', labelKey: 'T2/2', timeKey: 't2_2' },
        { id: 7, name: 'V7', bits: [1, 1, 1], bitsStr: '111', labelKey: 'T7/2', timeKey: 't7_2' },
        { id: 6, name: 'V6', bits: [1, 0, 1], bitsStr: '101', labelKey: 'T2/2', timeKey: 't2_2' },
        { id: 5, name: 'V5', bits: [0, 0, 1], bitsStr: '001', labelKey: 'T1/2', timeKey: 't1_2' },
        { id: 0, name: 'V0', bits: [0, 0, 0], bitsStr: '000', labelKey: 'T0/4', timeKey: 't0_4' },
      ];
    case 6:
    default:
      // V0(000) -> V1(100) [T2/2] -> V6(101) [T1/2] -> V7(111) -> V6(101) -> V1(100) -> V0(000)
      return [
        { id: 0, name: 'V0', bits: [0, 0, 0], bitsStr: '000', labelKey: 'T0/4', timeKey: 't0_4' },
        { id: 1, name: 'V1', bits: [1, 0, 0], bitsStr: '100', labelKey: 'T2/2', timeKey: 't2_2' },
        { id: 6, name: 'V6', bits: [1, 0, 1], bitsStr: '101', labelKey: 'T1/2', timeKey: 't1_2' },
        { id: 7, name: 'V7', bits: [1, 1, 1], bitsStr: '111', labelKey: 'T7/2', timeKey: 't7_2' },
        { id: 6, name: 'V6', bits: [1, 0, 1], bitsStr: '101', labelKey: 'T1/2', timeKey: 't1_2' },
        { id: 1, name: 'V1', bits: [1, 0, 0], bitsStr: '100', labelKey: 'T2/2', timeKey: 't2_2' },
        { id: 0, name: 'V0', bits: [0, 0, 0], bitsStr: '000', labelKey: 'T0/4', timeKey: 't0_4' },
      ];
  }
}

/**
 * Returns exact 7-segment intervals with boundaries for timing diagram and simulation.
 */
export function getSvpwm7Segments(
  sector: number,
  t1: number,
  t2: number,
  t0: number,
  ts: number
): SvpwmSegment[] {
  const seq = getSectorSequence(sector);
  const durations: number[] = seq.map((item) => {
    switch (item.timeKey) {
      case 't0_4':
        return t0 / 4;
      case 't1_2':
        return t1 / 2;
      case 't2_2':
        return t2 / 2;
      case 't7_2':
        return t0 / 2; // T7 = T0/2
    }
  });

  let currentT = 0;
  return seq.map((item, idx) => {
    const dur = durations[idx];
    const tStart = currentT / ts;
    currentT += dur;
    const tEnd = Math.min(1.0, currentT / ts);

    return {
      id: item.id,
      name: item.name,
      bits: item.bits,
      bitsStr: item.bitsStr,
      duration: dur,
      tStart,
      tEnd,
      label: item.labelKey,
    };
  });
}

/** Calculate dwell times and duty cycles for current theta, m, and Ts */
export function calculateSvpwm(
  theta: number,
  m: number,
  vdc: number,
  fsw: number
): {
  sector: number;
  vRefMag: number;
  vAlpha: number;
  vBeta: number;
  ts: number;
  t1: number;
  t2: number;
  t0: number;
  t000: number;
  t111: number;
  da: number;
  db: number;
  dc: number;
} {
  let normTheta = theta % (2 * Math.PI);
  if (normTheta < 0) normTheta += 2 * Math.PI;

  const sector = getSector(normTheta);
  const ts = 1 / fsw;

  // Max linear radius is Vdc / sqrt(3)
  const maxLinearVref = vdc / Math.sqrt(3);
  const vRefMag = m * maxLinearVref;

  // Alpha-Beta components
  const vAlpha = vRefMag * Math.cos(normTheta);
  const vBeta = vRefMag * Math.sin(normTheta);

  // Angle within sector [0, PI/3)
  const alpha = normTheta - (sector - 1) * (Math.PI / 3);

  // Volt-second balance dwell times
  let t1 = m * ts * Math.sin(Math.PI / 3 - alpha);
  let t2 = m * ts * Math.sin(alpha);

  // Handle overmodulation if t1 + t2 > Ts
  if (t1 + t2 > ts) {
    const scale = ts / (t1 + t2);
    t1 *= scale;
    t2 *= scale;
  }

  const t0 = Math.max(0, ts - t1 - t2);
  const t000 = t0 / 2;
  const t111 = t0 / 2;

  // Duty cycles for center-aligned PWM across each sector:
  // Leg on-times are exact sum of dwell times for which that leg is HIGH:
  let da = 0;
  let db = 0;
  let dc = 0;

  switch (sector) {
    case 1:
      da = (t1 + t2 + t0 / 2) / ts;
      db = (t2 + t0 / 2) / ts;
      dc = (t0 / 2) / ts;
      break;
    case 2:
      da = (t1 + t0 / 2) / ts;
      db = (t1 + t2 + t0 / 2) / ts;
      dc = (t0 / 2) / ts;
      break;
    case 3:
      da = (t0 / 2) / ts;
      db = (t1 + t2 + t0 / 2) / ts;
      dc = (t2 + t0 / 2) / ts;
      break;
    case 4:
      da = (t0 / 2) / ts;
      db = (t1 + t0 / 2) / ts;
      dc = (t1 + t2 + t0 / 2) / ts;
      break;
    case 5:
      da = (t2 + t0 / 2) / ts;
      db = (t0 / 2) / ts;
      dc = (t1 + t2 + t0 / 2) / ts;
      break;
    case 6:
      da = (t1 + t2 + t0 / 2) / ts;
      db = (t0 / 2) / ts;
      dc = (t1 + t0 / 2) / ts;
      break;
  }

  // Bound duty cycles strictly between 0 and 1
  da = Math.min(Math.max(da, 0), 1);
  db = Math.min(Math.max(db, 0), 1);
  dc = Math.min(Math.max(dc, 0), 1);

  return {
    sector,
    vRefMag,
    vAlpha,
    vBeta,
    ts,
    t1,
    t2,
    t0,
    t000,
    t111,
    da,
    db,
    dc,
  };
}

/**
 * Determine instantaneous switch bits [Sa, Sb, Sc] for a given sub-cycle progress tau in [0, 1).
 * In center-aligned PWM, each leg X has a centered pulse with on-time Dx * Ts.
 * The carrier C(tau) = |1 - 2*tau| (V-shape: 1 at tau=0, 0 at tau=0.5, 1 at tau=1).
 * Switch X is HIGH if and only if C(tau) <= Dx!
 */
export function getInstantaneousSwitchBits(
  da: number,
  db: number,
  dc: number,
  tau: number
): [number, number, number] {
  const normTau = Math.min(Math.max(tau, 0), 0.999999);
  const carrier = Math.abs(1 - 2 * normTau);

  const sa = carrier <= da ? 1 : 0;
  const sb = carrier <= db ? 1 : 0;
  const sc = carrier <= dc ? 1 : 0;

  return [sa, sb, sc];
}

/**
 * Compute the saddle-wave (Zero-Sequence Injection / min-max offset) for comparison.
 */
export function getModulationWaveforms(theta: number, m: number, vdc: number) {
  const maxLinear = vdc / Math.sqrt(3);
  const vm = m * maxLinear;

  // Pure sinusoidal phase voltages
  const va = vm * Math.cos(theta);
  const vb = vm * Math.cos(theta - (2 * Math.PI) / 3);
  const vc = vm * Math.cos(theta + (2 * Math.PI) / 3);

  // Zero-sequence common mode offset
  const maxV = Math.max(va, vb, vc);
  const minV = Math.min(va, vb, vc);
  const vZso = -0.5 * (maxV + minV);

  // SVPWM saddle waveforms (sum of fundamental + zero-sequence)
  const vaSvpwm = va + vZso;
  const vbSvpwm = vb + vZso;
  const vcSvpwm = vc + vZso;

  // 3rd harmonic injection waveform (0.25 * V3)
  const v3 = (vm / 6) * Math.sin(3 * theta);
  const vaThi = va - v3;
  const vbThi = vb - v3;
  const vcThi = vc - v3;

  return {
    va,
    vb,
    vc,
    vZso,
    vaSvpwm,
    vbSvpwm,
    vcSvpwm,
    vaThi,
    vbThi,
    vcThi,
  };
}

/**
 * Generate discrete waveform series over one full electrical cycle (360 degrees).
 */
export interface WaveformDataPoint {
  thetaDeg: number;
  thetaRad: number;
  // Sinusoidal
  vaSin: number;
  vbSin: number;
  vcSin: number;
  // SVPWM Saddle
  vaSvpwm: number;
  vbSvpwm: number;
  vcSvpwm: number;
  vZso: number;
  // Duty cycles
  da: number;
  db: number;
  dc: number;
  // Inverter PWM instantaneous line & phase voltages
  vabPwm: number;
  vanPwm: number;
  vanFiltered: number;
  sector: number;
}

export function generateCycleWaveforms(
  m: number,
  vdc: number,
  fsw: number,
  points: number = 720
): WaveformDataPoint[] {
  const result: WaveformDataPoint[] = [];
  const f0 = 50;
  const ratio = fsw / f0; // number of carrier cycles per fundamental cycle

  // Filter accumulator for phase-to-neutral voltage
  let filterState = 0;
  const filterAlpha = 0.05;

  for (let i = 0; i < points; i++) {
    const thetaRad = (i / points) * 2 * Math.PI;
    const thetaDeg = (i / points) * 360;

    const mod = getModulationWaveforms(thetaRad, m, vdc);
    const svp = calculateSvpwm(thetaRad, m, vdc, fsw);

    // Instantaneous carrier progress
    const carrierProgress = (thetaRad / (2 * Math.PI) * ratio) % 1;
    const [sa, sb, sc] = getInstantaneousSwitchBits(svp.da, svp.db, svp.dc, carrierProgress);

    // Inverter voltages
    const vaN = sa * vdc;
    const vbN = sb * vdc;
    const vcN = sc * vdc;
    const vabPwm = vaN - vbN;
    const vnN = (vaN + vbN + vcN) / 3;
    const vanPwm = vaN - vnN;

    // First-order low pass filter simulating motor load
    filterState = filterState + filterAlpha * (vanPwm - filterState);

    result.push({
      thetaDeg,
      thetaRad,
      vaSin: mod.va,
      vbSin: mod.vb,
      vcSin: mod.vc,
      vaSvpwm: mod.vaSvpwm,
      vbSvpwm: mod.vbSvpwm,
      vcSvpwm: mod.vcSvpwm,
      vZso: mod.vZso,
      da: svp.da,
      db: svp.db,
      dc: svp.dc,
      vabPwm,
      vanPwm,
      vanFiltered: filterState,
      sector: svp.sector,
    });
  }

  return result;
}

/**
 * Calculate harmonic spectrum (FFT approximation) for PWM output comparing SPWM and SVPWM.
 */
export interface HarmonicBar {
  order: number;
  freqHz: number;
  magnitudePercent: number; // relative to fundamental
  isCarrier: boolean;
}

export function calculateHarmonicSpectrum(
  m: number,
  f0: number,
  fsw: number,
  mode: 'svpwm' | 'spwm'
): {
  harmonics: HarmonicBar[];
  thdPercent: number;
  fundamentalV: number;
  dcUtilizationPercent: number;
} {
  const carrierRatio = Math.round(fsw / f0);
  const harmonics: HarmonicBar[] = [];

  // Fundamental amplitude:
  // For SVPWM, linear max is 100% of max possible (0.577 * Vdc)
  // For SPWM, linear max is 0.500 * Vdc (15.5% less)
  const fundamentalScale = mode === 'svpwm' ? Math.min(m, 1.155) : Math.min(m, 1.0) * 0.866;
  const fundamentalV = fundamentalScale * (400 / Math.sqrt(3));
  const dcUtilizationPercent = mode === 'svpwm' 
    ? Math.min(100, Math.round((fundamentalScale / 1.0) * 100 * 1.155))
    : Math.min(86.6, Math.round((fundamentalScale / 0.866) * 86.6));

  harmonics.push({
    order: 1,
    freqHz: f0,
    magnitudePercent: 100,
    isCarrier: false,
  });

  // Low order harmonics (3, 5, 7, 9, 11)
  // Triplens (3, 9, 15) are zero in balanced line voltages!
  // In SVPWM linear region, low order harmonics are negligible (< 0.5%)
  // In overmodulation (m > 1.0), 5th and 7th grow significantly!
  const isOvermodulated = m > 1.0;
  const overmodDepth = Math.max(0, m - 1.0);

  const lowOrders = [3, 5, 7, 9, 11, 13];
  lowOrders.forEach((order) => {
    let mag = 0.2;
    if (order % 3 === 0) {
      mag = 0; // line-to-line cancels triplens
    } else if (isOvermodulated) {
      mag = (1 / order) * (overmodDepth * 35);
    }
    harmonics.push({
      order,
      freqHz: order * f0,
      magnitudePercent: Math.min(30, mag),
      isCarrier: false,
    });
  });

  // Carrier harmonics centered around mf = fsw / f0 and 2*mf
  const carrierOrders = [
    carrierRatio - 4,
    carrierRatio - 2,
    carrierRatio - 1,
    carrierRatio,
    carrierRatio + 1,
    carrierRatio + 2,
    carrierRatio + 4,
    2 * carrierRatio - 1,
    2 * carrierRatio + 1,
  ];

  carrierOrders.forEach((order) => {
    if (order <= 13) return;
    const diff = Math.abs(order - carrierRatio);
    let mag = 0;
    if (mode === 'svpwm') {
      // In SVPWM, sidebands around carrier are lower, centered around 2*fc
      if (diff === 0) mag = 4;
      else if (diff === 1 || diff === 2) mag = 18 - diff * 3;
      else mag = 6;
    } else {
      // Standard SPWM has higher carrier frequency harmonics
      if (diff === 0) mag = 12;
      else if (diff === 1 || diff === 2) mag = 24 - diff * 4;
      else mag = 8;
    }

    harmonics.push({
      order,
      freqHz: order * f0,
      magnitudePercent: Math.min(35, mag),
      isCarrier: true,
    });
  });

  // Sort by order
  harmonics.sort((a, b) => a.order - b.order);

  // Compute THD% based on non-fundamental harmonics
  let sumSquares = 0;
  harmonics.slice(1).forEach((h) => {
    sumSquares += (h.magnitudePercent / 100) ** 2;
  });
  const thdPercent = Number((Math.sqrt(sumSquares) * 100).toFixed(1));

  return {
    harmonics,
    thdPercent,
    fundamentalV: Math.round(fundamentalV),
    dcUtilizationPercent,
  };
}
