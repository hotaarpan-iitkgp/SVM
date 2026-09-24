import { TeachingStep } from '../types';

export const CURRICULUM_STEPS: TeachingStep[] = [
  {
    id: 'inverter-topology',
    title: '1. Three-Phase Inverter & 8 Switching States',
    subtitle: 'From 6 semiconductor switches to 8 discrete voltage states',
    description: `A conventional three-phase Voltage Source Inverter (VSI) consists of 3 half-bridge legs (A, B, C) connected across a DC link voltage Vdc. Each leg contains two complementary switches (an upper and a lower IGBT/MOSFET).
    
Because the two switches in each leg cannot be turned on simultaneously (to prevent shoot-through short circuits), each leg has exactly two valid states:
• Sa = 1: Upper switch closed, leg terminal connected to +Vdc
• Sa = 0: Lower switch closed, leg terminal connected to 0V (DC negative)

With 3 independent legs, there are 2³ = 8 total switching combinations:
• 6 Active Vectors (V1 to V6): Form a symmetric hexagon of magnitude 2/3 · Vdc spaced 60° apart in the stationary plane.
• 2 Zero (Null) Vectors (V0 = [000] and V7 = [111]): Both short-circuit the load terminals together, producing zero line-to-line output voltage.`,
    keyPoints: [
      '3 inverter legs with complementary switching yield 8 discrete states [Sa, Sb, Sc]',
      '6 Active vectors (V1..V6) each have length (2/3)·Vdc and produce active power flow',
      '2 Zero vectors (V0=[000], V7=[111]) circulate freewheeling current with zero line voltage',
    ],
    formula: 'V_{leg} = S_k \\cdot V_{dc}, \\quad k \\in \\{a, b, c\\}, \\; S_k \\in \\{0, 1\\}',
    suggestedPreset: { m: 0.8, theta: 0.52 },
    quiz: {
      question: 'Why are states [000] and [111] called "Zero Vectors"?',
      options: [
        'They cause the DC bus power supply to shut off',
        'All three motor phases are tied to the same potential, yielding 0V line-to-line',
        'Only zero frequency DC currents are permitted to flow',
        'They are invalid states that cause a shoot-through fault',
      ],
      correctIndex: 1,
      explanation: 'When all upper switches [111] or all lower switches [000] are closed simultaneously, all three phase terminals are at the exact same electrical potential. Consequently, all line-to-line voltages (Vab, Vbc, Vca) are zero!',
    },
  },
  {
    id: 'clarke-transform',
    title: '2. The Clarke Transformation (abc → αβ)',
    subtitle: 'Projecting 3-phase sinusoidal voltages onto a 2D stationary orthogonal plane',
    description: `In a balanced 3-phase system, the phase voltages Va(t), Vb(t), and Vc(t) are displaced by 120° in time:
Va = Vm · cos(θ)
Vb = Vm · cos(θ - 2π/3)
Vc = Vm · cos(θ + 2π/3)

Edith Clarke introduced the Clarke transformation in 1938 to project these three interdependent quantities onto a 2-axis stationary Cartesian coordinate system (α, β). In the amplitude-invariant Clarke transform:
Vα = 2/3 · (Va - 0.5·Vb - 0.5·Vc)
Vβ = 2/3 · (√3/2·Vb - √3/2·Vc) = 1/√3 · (Vb - Vc)

Under balanced sinusoidal conditions, the space vector V_ref = Vα + j·Vβ traces out a pure, smooth circle rotating at angular speed ω = 2π·f0.`,
    keyPoints: [
      'Converts 3-phase time-varying AC quantities into a single rotating 2D space vector V_ref',
      'The magnitude |V_ref| = √(Vα² + Vβ²) remains constant for balanced sinusoidal operation',
      'The angle θ = atan2(Vβ, Vα) indicates the instantaneous orientation of the rotating stator flux',
    ],
    formula: '\\vec{V}_{ref} = V_\\alpha + j V_\\beta = |V_{ref}| e^{j\\theta}',
    suggestedPreset: { m: 0.85, theta: 0.8 },
    quiz: {
      question: 'What shape does the space vector V_ref trace over time in a balanced 3-phase system?',
      options: [
        'A triangle with 120° vertices',
        'A perfect circle rotating at fundamental frequency f0',
        'A square pulsating between +Vdc and -Vdc',
        'A stationary line oscillating along the alpha axis',
      ],
      correctIndex: 1,
      explanation: 'Because Va, Vb, and Vc are sinusoidal with 120° phase displacements and equal amplitudes, their vector sum in the αβ complex plane produces a circle of constant radius rotating at ω = 2π·f0.',
    },
  },
  {
    id: 'hexagon-sectors',
    title: '3. The Voltage Hexagon & 6 Sectors',
    subtitle: 'Why SVPWM provides +15.5% higher voltage utilization than SPWM',
    description: `When we plot all 8 discrete inverter vectors in the αβ plane:
• V1(100) points at 0° with length (2/3)·Vdc
• V2(110) points at 60°
• V3(010) points at 120°
• V4(011) points at 180°
• V5(001) points at 240°
• V6(101) points at 300°

Connecting the tips of the 6 active vectors forms a regular hexagon divided into 6 equal 60° sectors.
• Maximum Linear Output: The largest circular trajectory that fits inside the hexagon without distortion is the inscribed circle!
• Its radius is R_inscribed = (2/3)·Vdc · cos(30°) = Vdc / √3 ≈ 0.577 · Vdc.
• In contrast, conventional Sinusoidal PWM (SPWM) can only achieve a phase peak of Vdc / 2 = 0.500 · Vdc.
• Therefore, SVPWM extracts (1/√3) / (1/2) = 2/√3 ≈ 1.1547 (a 15.47% boost in fundamental output voltage) from the exact same DC bus!`,
    keyPoints: [
      'The 6 active vectors define the outer vertices of the voltage hexagon',
      'The inscribed circle has radius Vdc/√3 ≈ 0.577·Vdc (maximum linear modulation, m = 1.0)',
      'SVPWM achieves 15.5% higher DC voltage utilization than carrier-based SPWM without distortion',
    ],
    formula: 'R_{max} = \\frac{2}{3} V_{dc} \\cos(30^\\circ) = \\frac{V_{dc}}{\\sqrt{3}} \\approx 0.577 V_{dc}',
    suggestedPreset: { m: 1.0, theta: 0.52 },
    quiz: {
      question: 'How much higher is the maximum linear AC output voltage of SVPWM compared to standard SPWM?',
      options: [
        '5.0% higher',
        '15.5% higher (2/√3)',
        '33.3% higher',
        '50% higher',
      ],
      correctIndex: 1,
      explanation: 'SVPWM utilizes the inscribed circle of the hexagon (radius Vdc/√3 ≈ 0.577·Vdc), whereas standard SPWM is bounded by Vdc/2 = 0.500·Vdc. The ratio is (1/√3)/(0.5) = 2/√3 ≈ 1.1547, or 15.47% higher!',
    },
  },
  {
    id: 'volt-second-balance',
    title: '4. Volt-Second Balance & Dwell Times',
    subtitle: 'Synthesizing any arbitrary reference vector using time-averaging over Ts',
    description: `An inverter cannot output an arbitrary analog voltage vector directly; it can only output one of the 8 discrete states.
However, if we switch between adjacent active vectors (V1, V2) and zero vectors (V0, V7) rapidly at switching frequency fsw = 1/Ts, the time-averaged output over period Ts equals the desired reference vector V_ref!

By the Volt-Second Balance principle:
V_ref · Ts = V_x · T1 + V_y · T2 + V_0 · T0

In Sector 1 (between V1 at 0° and V2 at 60°), with α = θ:
• T1 = m · Ts · sin(60° - α)
• T2 = m · Ts · sin(α)
• T0 = Ts - (T1 + T2)

Notice that as V_ref moves from 0° to 60°, T1 smoothly decreases while T2 smoothly increases. The remaining time T0 is assigned to zero vectors to control the vector amplitude!`,
    keyPoints: [
      'Any vector inside a sector is synthesized as a weighted linear combination of two adjacent active vectors and zero vectors',
      'Dwell times T1 and T2 represent the exact durations each active vector is applied during switching period Ts',
      'The zero vector time T0 regulates the vector magnitude (smaller magnitude means longer zero time)',
    ],
    formula: 'T_1 = m T_s \\sin\\left(\\frac{\\pi}{3} - \\alpha\\right), \\quad T_2 = m T_s \\sin(\\alpha), \\quad T_0 = T_s - T_1 - T_2',
    suggestedPreset: { m: 0.75, theta: 0.4 },
    quiz: {
      question: 'If the reference vector magnitude |V_ref| decreases toward zero, what happens to T0?',
      options: [
        'T0 decreases to zero',
        'T0 increases to occupy almost the entire switching period Ts',
        'T0 remains constant at Ts/2',
        'T1 and T2 become negative',
      ],
      correctIndex: 1,
      explanation: 'When |V_ref| approaches zero (m → 0), active dwell times T1 and T2 shrink to zero. Therefore, T0 = Ts - T1 - T2 approaches Ts, meaning the inverter spends nearly all time in the zero states (000/111) to produce zero net voltage.',
    },
  },
  {
    id: 'symmetrical-pwm',
    title: '5. Symmetrical 7-Segment PWM Pattern',
    subtitle: 'Minimizing switching losses and high-frequency harmonic ripple',
    description: `How should we order the active and zero vectors within each switching period Ts?
If we simply switched 000 → 100 → 110 and stayed there, some legs would experience double switching or large voltage steps.

The industry-standard solution is the Symmetrical 7-Segment Center-Aligned sequence:
In Sector 1:
000 → 100 → 110 → 111 → 110 → 100 → 000
(V0  →  V1  →  V2  →  V7  →  V2  →  V1  →  V0)

With segment durations:
[T0/4] → [T1/2] → [T2/2] → [T7/2] → [T2/2] → [T1/2] → [T0/4]  (where T7 = T0/2)

Key advantages of this pattern:
1. Single-switch transition: At every step, only ONE inverter leg changes state (000→100 changes A, 100→110 changes B, 110→111 changes C).
2. Symmetry: The pattern is mirrored around the center of Ts, canceling out odd-order switching harmonics and drastically reducing motor ripple.`,
    keyPoints: [
      'Center-aligned 7 segments: V0 → V_x → V_y → V7 → V_y → V_x → V0',
      'Each transition involves exactly ONE leg switching, minimizing switching losses',
      'Symmetry creates an effective switching ripple frequency of 2·fsw, doubling ripple cancellation',
    ],
    formula: 'T_{sequence} = \\left[ \\frac{T_0}{4}, \\frac{T_1}{2}, \\frac{T_2}{2}, \\frac{T_0}{2}, \\frac{T_2}{2}, \\frac{T_1}{2}, \\frac{T_0}{4} \\right]',
    suggestedPreset: { m: 0.85, theta: 0.5 },
    quiz: {
      question: 'In the 7-segment sequence [000 → 100 → 110 → 111 ...], how many inverter legs toggle at each transition?',
      options: [
        'All three legs simultaneously',
        'Two legs at a time',
        'Exactly one leg at a time',
        'It alternates randomly between 1 and 3',
      ],
      correctIndex: 2,
      explanation: 'Only one leg flips between 000 (none) → 100 (A flips) → 110 (B flips) → 111 (C flips). This minimizes switching events and prevents unnecessary dV/dt stress on the motor insulation!',
    },
  },
  {
    id: 'saddle-wave-equivalence',
    title: '6. Zero-Sequence Injection & The Saddle Wave',
    subtitle: 'The carrier-based equivalence theorem between SVPWM and min-max injection',
    description: `A celebrated discovery in power electronics is that Space Vector Modulation can be implemented identically using standard carrier-based PWM with a common-mode offset!

If we take the three pure sine waves:
Va = Vm · cos(θ),  Vb = Vm · cos(θ - 2π/3),  Vc = Vm · cos(θ + 2π/3)
and add a dynamic Zero-Sequence Offset (min-max injection):
V_offset = -0.5 · [max(Va, Vb, Vc) + min(Va, Vb, Vc)]

The resulting modified reference waveforms Va* = Va + V_offset exhibit a characteristic "saddle-like" or dual-peak shape.
Why does this work so brilliantly?
• The saddle waveform pulls the positive and negative peaks inward by 15.5%, allowing the fundamental amplitude to increase up to 1.155 without clipping against the DC rails ±Vdc/2!
• Because V_offset is identical in all three phases (common mode), it cancels out entirely when computing the line-to-line voltages:
Vab = Va* - Vb* = (Va + V_offset) - (Vb + V_offset) = Va - Vb!
The motor sees only pure, undistorted fundamental voltage!`,
    keyPoints: [
      'Carrier-based SVPWM adds V_offset = -0.5·[max(V) + min(V)] to each phase reference',
      'Creates the iconic saddle waveform that fits 15.5% larger voltages within the DC rails',
      'The common-mode offset completely cancels across line-to-line terminals (Vab, Vbc, Vca)',
    ],
    formula: 'V_{offset} = -\\frac{1}{2}\\left(\\max(V_a, V_b, V_c) + \\min(V_a, V_b, V_c)\\right), \\quad V_a^* = V_a + V_{offset}',
    suggestedPreset: { m: 1.0, theta: 1.57 },
    quiz: {
      question: 'Why doesn\'t the saddle shape distort the current flowing through a 3-wire star/delta AC motor?',
      options: [
        'The motor magnetic core filters it out with eddy currents',
        'The zero-sequence offset is identical in all 3 phases, canceling out in line-to-line voltages (Vab = Va - Vb)',
        'The inverter software adds a digital notch filter',
        'The saddle waveform only affects the zero vector',
      ],
      correctIndex: 1,
      explanation: 'In 3-wire loads with no neutral return wire, common-mode voltages (which appear identically in all phases) cannot drive any current because (Va + V_offset) - (Vb + V_offset) = Va - Vb. The offset cancels completely!',
    },
  },
  {
    id: 'overmodulation',
    title: '7. Overmodulation & Six-Step Transition',
    subtitle: 'Pushing past the linear limit: Region I, Region II, and square-wave operation',
    description: `What happens if the motor control algorithm commands a modulation index m > 1.0?

1. Linear Region (0 ≤ m ≤ 1.0):
The reference vector trajectory remains entirely inside the inscribed circle (radius Vdc/√3). Output voltage is purely linear and free of low-order harmonics.

2. Overmodulation Mode I (1.0 < m ≤ 1.1547):
The commanded circle extends beyond the hexagon flats. Since the inverter cannot output voltages beyond the hexagon perimeter, the trajectory is clipped along the hexagon edges. Low-order harmonics (5th, 7th, 11th) start to appear.

3. Overmodulation Mode II (1.1547 < m < 1.273):
The trajectory is held at the hexagon vertices (V1..V6) for increasing angles. The holding angle increases until the vector jumps directly from vertex to vertex.

4. Six-Step (Square Wave) Operation (m = 4/π ≈ 1.273):
The inverter spends 60° purely at each vertex (V1 → V2 → V3 → V4 → V5 → V6). This extracts the absolute maximum theoretical fundamental AC voltage (4/π · Vdc/2 ≈ 1.273), but generates substantial harmonic distortion.`,
    keyPoints: [
      'm ≤ 1.0: Linear SVPWM (inscribed circle, no low-order harmonics)',
      '1.0 < m ≤ 1.155: Overmodulation I (trajectory clips along hexagon flats)',
      'm ≈ 1.273 (4/π): Six-step square wave operation (maximum DC voltage utilization)',
    ],
    formula: 'm_{max, linear} = 1.0, \\quad m_{six-step} = \\frac{4}{\\pi} \\approx 1.273',
    suggestedPreset: { m: 1.15, theta: 0.52 },
    quiz: {
      question: 'What is the absolute maximum fundamental modulation index obtainable in full six-step square wave operation?',
      options: [
        '1.000',
        '1.155 (2/√3)',
        '1.273 (4/π)',
        '1.414 (√2)',
      ],
      correctIndex: 2,
      explanation: 'In full six-step mode, the fundamental Fourier coefficient of a square wave is 4/π ≈ 1.273 of the nominal half-DC bus voltage. This yields the highest possible fundamental output from a 2-level inverter.',
    },
  },
  {
    id: 'harmonics-filtering',
    title: '8. Harmonic Spectrum & Motor Filtering',
    subtitle: 'How high-frequency PWM translates to smooth sinusoidal motor currents',
    description: `While the inverter output voltages (Vab, Van) consist of discontinuous stepped rectangular pulses with sharp edges, an AC electric motor does not see sharp voltage spikes as torque ripple.

Why?
The stator windings of an induction motor or PMSM act as an inductive-resistive (RL) low-pass filter with transfer function H(s) = 1 / (R + s·L).
Because motor inductance opposes high-frequency current changes (XL = 2π·f·L):
• Low fundamental frequency (e.g., 50 Hz): Low inductive impedance → large sinusoidal current.
• Switching frequency harmonics (e.g., 2,500 Hz to 10,000 Hz): Very high impedance → negligible harmonic current!

Furthermore, SVPWM pushes dominant voltage harmonics to sidebands around double the carrier frequency (2·fsw), where motor filtering is exceptionally effective. This results in ultra-smooth sinusoidal stator currents and whisper-quiet motor operation!`,
    keyPoints: [
      'Inverter pole voltages are 2-level pulses; line voltages are 3-level (-Vdc, 0, +Vdc); phase-neutral voltages are 5-level',
      'Motor winding inductance acts as an inherent low-pass filter, smoothing stepped pulses into continuous sine waves',
      'SVPWM achieves lower Total Harmonic Distortion (THD) and cleaner harmonic clustering than standard SPWM',
    ],
    formula: 'i(t) = \\frac{1}{L} \\int (v(t) - R i(t)) \\, dt, \\quad \\text{THD} = \\frac{\\sqrt{\\sum_{h=2}^\\infty V_h^2}}{V_1} \\times 100\\%',
    suggestedPreset: { m: 0.9, theta: 0.78 },
    quiz: {
      question: 'How do the stator windings of an electric motor convert stepped PWM voltage pulses into smooth torque?',
      options: [
        'Through thermal dissipation of the pulses into heat',
        'Motor inductance acts as a natural low-pass RL filter that blocks high-frequency harmonic currents',
        'The bearings mechanically absorb the voltage transitions',
        'Capacitors inside the rotor bypass the carrier frequency',
      ],
      correctIndex: 1,
      explanation: 'Motor winding inductance L presents high impedance Z = ωL to switching frequency harmonics (several kHz), attenuating harmonic currents by orders of magnitude and leaving only the smooth fundamental sinusoidal current!',
    },
  },
];
