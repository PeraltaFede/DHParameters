import { PI, toRad } from './dh.js';

let counter = 0;
export const uid = () => `j${Date.now().toString(36)}${(counter++).toString(36)}`;

/** A builder joint. Angles in radians, lengths in metres. */
export function makeJoint(type = 'R', fields = {}) {
  const base =
    type === 'R'
      ? { type: 'R', theta: 0, d: 0, a: 0.5, alpha: 0, offset: 0, qlim: [-PI, PI], q: 0 }
      : { type: 'P', theta: 0, d: 0, a: 0, alpha: 0, offset: 0, qlim: [0, 0.5], q: 0.2 };
  return { ...base, ...fields, id: uid() };
}

// Compact constructors in degrees, for readable preset tables (also used by the practice exercises).
export const R = (d, a, alphaDeg, { qDeg = 0, qlimDeg = [-180, 180], offsetDeg = 0 } = {}) => ({
  type: 'R', theta: 0, d, a, alpha: toRad(alphaDeg), offset: toRad(offsetDeg),
  qlim: qlimDeg.map(toRad), q: toRad(qDeg),
});
export const P = (thetaDeg, a, alphaDeg, { q = 0.2, qlim = [0, 0.5], offset = 0 } = {}) => ({
  type: 'P', theta: toRad(thetaDeg), d: 0, a, alpha: toRad(alphaDeg), offset, qlim, q,
});

export const PRESETS = [
  {
    id: 'planar2',
    label: 'Planar 2R arm',
    name: 'planar2',
    joints: [R(0, 1, 0, { qDeg: 30 }), R(0, 1, 0, { qDeg: 45 })],
  },
  {
    id: 'planar3',
    label: 'Planar 3R arm',
    name: 'planar3',
    joints: [R(0, 1, 0, { qDeg: 20 }), R(0, 0.8, 0, { qDeg: 40 }), R(0, 0.4, 0, { qDeg: 30 })],
  },
  {
    id: 'scara',
    label: 'SCARA (RRPR)',
    name: 'scara',
    joints: [
      R(0.4, 0.35, 0, { qDeg: 20 }),
      R(0, 0.3, 180, { qDeg: 45 }),
      P(0, 0, 0, { qlim: [0, 0.3], q: 0.1 }),
      R(0.05, 0, 0),
    ],
  },
  {
    id: 'cylindrical',
    label: 'Cylindrical (RPP)',
    name: 'cylindrical',
    joints: [
      R(0.3, 0, 0, { qDeg: 30 }),
      P(0, 0, -90, { qlim: [0.1, 0.6], q: 0.35 }),
      P(0, 0, 0, { qlim: [0.1, 0.5], q: 0.3 }),
    ],
  },
  {
    id: 'cartesian',
    label: 'Cartesian (PPP)',
    name: 'cartesian',
    joints: [
      P(0, 0, -90, { qlim: [0.1, 0.6], q: 0.3 }),
      P(-90, 0, -90, { qlim: [0.1, 0.6], q: 0.3 }),
      P(0, 0, 0, { qlim: [0.1, 0.6], q: 0.3 }),
    ],
  },
  {
    id: 'stanford',
    label: 'Stanford arm (RRPRRR)',
    name: 'Stanford',
    joints: [
      R(0.412, 0, -90, { qDeg: 20 }),
      R(0.154, 0, 90, { qDeg: 60 }),
      P(-90, 0.0203, 0, { qlim: [0.3, 1.3], q: 0.6 }),
      R(0, 0, -90),
      R(0, 0, 90, { qDeg: 30 }),
      R(0.263, 0, 0),
    ],
  },
  {
    id: 'puma',
    label: 'Puma 560 (RRRRRR)',
    name: 'Puma560',
    // Standard DH from RVC's mdl_puma560, shown at the nominal pose qn.
    joints: [
      R(0, 0, 90, { qlimDeg: [-160, 160] }),
      R(0, 0.4318, 0, { qDeg: 45, qlimDeg: [-45, 225] }),
      R(0.15005, 0.0203, -90, { qDeg: -180, qlimDeg: [-225, 45] }),
      R(0.4318, 0, 90, { qlimDeg: [-110, 170] }),
      R(0, 0, -90, { qDeg: 45, qlimDeg: [-100, 100] }),
      R(0, 0, 0, { qlimDeg: [-266, 266] }),
    ],
  },
];

export function instantiatePreset(preset) {
  return {
    name: preset.name,
    joints: preset.joints.map((j) => ({ ...j, qlim: [...j.qlim], id: uid() })),
  };
}
