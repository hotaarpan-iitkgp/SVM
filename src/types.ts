/**
 * Type definitions for Space Vector Modulation (SVPWM) interactive demonstration.
 */

export interface SpaceVector {
  id: number; // 0..7
  name: string; // V0..V7
  bits: [number, number, number]; // [Sa, Sb, Sc] e.g. [1, 0, 0]
  angleDeg: number; // 0, 60, 120, etc.
  magnitude: number; // 0 or 2/3 * Vdc
  label: string;
}

export type ModulationMode = 'svpwm' | 'spwm' | 'thipwm';

export type ActiveTab = 'visualizer' | 'rotating-field' | 'dwell' | 'multilevel' | 'equations' | 'curriculum';

export interface SvpwmState {
  // Parameters
  vdc: number; // DC Bus Voltage (V), default 400
  f0: number; // Fundamental Frequency (Hz), default 50
  fsw: number; // Switching Frequency (Hz), default 2500
  m: number; // Modulation Index (0..1.25)
  mode: ModulationMode;
  
  // Real-time animation & position
  theta: number; // Current angle in radians [0, 2*PI)
  thetaDeg: number; // Current angle in degrees [0, 360)
  isPlaying: boolean;
  speed: number; // Simulation playback speed multiplier (0.01x .. 0.10x)
  
  // Calculations for current theta
  sector: number; // 1..6
  vAlpha: number; // V_ref projection on alpha
  vBeta: number; // V_ref projection on beta
  vRefMag: number; // Magnitude of V_ref in Volts
  
  // Dwell times in current Ts
  ts: number; // Switching period (s) = 1/fsw
  t1: number; // Time for primary active vector (s)
  t2: number; // Time for secondary active vector (s)
  t0: number; // Total zero vector time (s)
  t000: number; // Time for V0(000) (s)
  t111: number; // Time for V7(111) (s)
  
  // Duty cycles for legs A, B, C (0..1)
  da: number;
  db: number;
  dc: number;
  
  // Active vector at current micro-time within Ts
  subCycleProgress: number; // 0..1 within Ts
  activeVectorId: number; // 0..7 currently active
  activeBits: [number, number, number]; // [Sa, Sb, Sc] currently active
}

export interface TeachingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  keyPoints: string[];
  formula?: string;
  suggestedPreset?: Partial<SvpwmState>;
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}
