// Practice exercises for the Robot builder: preset robots with randomized sizes,
// three levels (1 reach, 2 model, 3 model + reach) and the checks behind them.
//
// Model check. A student's DH table is accepted when, at the drawn configuration q_ref,
// every joint has the right type, every joint axis (z_{j-1}, as a directed line) lies on the
// true axis, and the tool frame {n} coincides with the true one. By the product of
// exponentials, T(q) = prod_j exp(xi_j (q_j - q_ref_j)) T(q_ref), so that makes the model
// equal to the true robot for every q, whatever (valid) x-axes and offsets the student chose.
import { axis, axisError, fkine, PI, poseError, pos, robotScale, toDeg, toRad, withQ } from './dh.js';
import { angleLabel, fmtNum } from './format.js';
import { P, R } from './presets.js';

export const LEVELS = [
  { id: 1, short: 'Reach', label: 'Reach a pose' },
  { id: 2, short: 'Model', label: 'Model the robot' },
  { id: 3, short: 'Model + reach', label: 'Model it, then reach' },
];

/** A value on a `step` grid between lo and hi (inclusive). */
function grid(rnd, lo, hi, step) {
  const n = Math.max(0, Math.floor((hi - lo) / step + 1e-9));
  return Math.round((lo + step * Math.floor(rnd() * (n + 1))) * 1e6) / 1e6;
}
const len = (rnd, lo, hi) => grid(rnd, lo, hi, 0.05);

/** Robots to practise on: the builder presets, with link sizes drawn on a 0.05 m grid. */
export const TEMPLATES = [
  {
    id: 'planar2',
    label: 'Planar 2R',
    name: 'planar2',
    axes: 2,
    build: (r) => [R(0, len(r, 0.4, 1.0), 0), R(0, len(r, 0.3, 0.8), 0)],
  },
  {
    id: 'planar3',
    label: 'Planar 3R',
    name: 'planar3',
    axes: 3,
    build: (r) => [R(0, len(r, 0.4, 0.9), 0), R(0, len(r, 0.3, 0.7), 0), R(0, len(r, 0.15, 0.4), 0)],
  },
  {
    id: 'scara',
    label: 'SCARA (RRPR)',
    name: 'scara',
    axes: 4,
    build: (r) => [
      R(len(r, 0.3, 0.5), len(r, 0.25, 0.45), 0),
      R(0, len(r, 0.2, 0.4), 180),
      P(0, 0, 0, { qlim: [0, 0.3] }),
      R(len(r, 0.05, 0.1), 0, 0),
    ],
  },
  {
    id: 'cylindrical',
    label: 'Cylindrical (RPP)',
    name: 'cylindrical',
    axes: 3,
    build: (r) => [
      R(len(r, 0.2, 0.4), 0, 0),
      P(0, 0, -90, { qlim: [0.1, len(r, 0.5, 0.7)] }),
      P(0, 0, 0, { qlim: [0.1, len(r, 0.4, 0.6)] }),
    ],
  },
  {
    id: 'cartesian',
    label: 'Cartesian (PPP)',
    name: 'cartesian',
    axes: 3,
    build: (r) => [
      P(0, 0, -90, { qlim: [0.1, len(r, 0.5, 0.8)] }),
      P(-90, 0, -90, { qlim: [0.1, len(r, 0.5, 0.8)] }),
      P(0, 0, 0, { qlim: [0.1, len(r, 0.4, 0.7)] }),
    ],
  },
  {
    id: 'stanford',
    label: 'Stanford arm (RRPRRR)',
    name: 'stanford',
    axes: 6,
    build: (r) => [
      R(len(r, 0.3, 0.5), 0, -90),
      R(len(r, 0.1, 0.2), 0, 90),
      P(-90, 0, 0, { qlim: [0.3, 1.0] }),
      R(0, 0, -90),
      R(0, 0, 90),
      R(len(r, 0.1, 0.3), 0, 0),
    ],
  },
  {
    id: 'puma',
    label: 'Puma-type (6R)',
    name: 'puma',
    axes: 6,
    build: (r) => [
      R(0, 0, 90, { qlimDeg: [-160, 160] }),
      R(0, len(r, 0.35, 0.55), 0, { qlimDeg: [-45, 225] }),
      R(len(r, 0.1, 0.2), len(r, 0, 0.05), -90, { qlimDeg: [-225, 45] }),
      R(len(r, 0.35, 0.55), 0, 90, { qlimDeg: [-110, 170] }),
      R(0, 0, -90, { qlimDeg: [-100, 100] }),
      R(0, 0, 0, { qlimDeg: [-266, 266] }),
    ],
  },
];

/** Robots a level draws from at random: finding q by hand is only reasonable up to 4 axes. */
export const poolFor = (level) => (level === 2 ? TEMPLATES : TEMPLATES.filter((t) => t.axes <= 4));

/** Mid-range extension on the 0.05 m grid, for drawing prismatic joints. */
function midExtension([lo, hi]) {
  const m = Math.round(((lo + hi) / 2) / 0.05) * 0.05;
  return Math.round(Math.min(hi, Math.max(lo, m)) * 1e6) / 1e6;
}

/** Target joint values on a 5° / 0.05 m grid, clearly away from the drawn pose. */
function randomTarget(truth, qRef, rnd) {
  let q = qRef;
  for (let tries = 0; tries < 60; tries++) {
    q = truth.map((j) => {
      if (j.type === 'P') return grid(rnd, j.qlim[0], j.qlim[1], 0.05);
      const lo = Math.max(-135, Math.ceil(toDeg(j.qlim[0]) / 5) * 5 + 5);
      const hi = Math.min(135, Math.floor(toDeg(j.qlim[1]) / 5) * 5 - 5);
      return toRad(grid(rnd, lo, hi, 5));
    });
    const moved = q.filter((v, i) => Math.abs(v - qRef[i]) > (truth[i].type === 'R' ? toRad(12) : 0.08)).length;
    if (moved >= Math.min(2, q.length)) return q;
  }
  return q;
}

let seq = 0;

export function makeExercise(level, templateId = 'random', rnd = Math.random) {
  const pool = poolFor(level);
  const tpl =
    templateId === 'random'
      ? pool[Math.floor(rnd() * pool.length)]
      : TEMPLATES.find((t) => t.id === templateId) ?? pool[0];
  const truth = tpl.build(rnd).map((j, i) => ({ ...j, id: `t${i + 1}` }));
  // Revolute joints are drawn at 0; prismatic ones half extended so the link shows.
  const qRef = truth.map((j) => (j.type === 'R' ? 0 : midExtension(j.qlim)));
  const qTarget = randomTarget(truth, qRef, rnd);
  return {
    id: `${tpl.id}-${Date.now().toString(36)}${(seq++).toString(36)}`,
    level,
    templateId: tpl.id,
    label: tpl.label,
    name: tpl.name,
    axes: tpl.axes,
    truth,
    qRef,
    qTarget,
    target: fkine(withQ(truth, qTarget)).at(-1),
    s: robotScale(truth),
  };
}

/** What the student starts with: the given table (level 1) or n blank revolute rows. */
export function studentStart(ex) {
  if (ex.level === 1) return { joints: ex.truth.map((j) => ({ ...j })), q: [...ex.qRef] };
  return {
    joints: ex.truth.map((t, i) => ({
      id: `s${i + 1}-${ex.id}`,
      type: 'R',
      theta: 0,
      d: 0,
      a: 0,
      alpha: 0,
      offset: 0,
      qlim: t.type === 'R' ? [...t.qlim] : [-PI, PI],
      q: 0,
    })),
    q: [...ex.qRef],
  };
}

/** The answer: the true table and one set of joint values that reaches the target. */
export function solution(ex) {
  return {
    joints: ex.truth.map((t, i) => ({ ...t, id: `s${i + 1}-${ex.id}` })),
    q: ex.level === 2 ? [...ex.qRef] : [...ex.qTarget],
  };
}

/* ------------------------------------------------------------------ checks */

export const MODEL_TOL = { ang: toRad(0.5), dist: 0.002 };
export const REACH_TOL = { ang: toRad(1), dist: 0.005 };
const sizeK = (ex) => Math.max(ex.s, 1);

export function checkModel(ex, student) {
  const n = ex.truth.length;
  if (student.length !== n) return { ok: false, items: [{ key: 'count', kind: 'count', ok: false }] };
  const Fs = fkine(withQ(student, ex.qRef));
  const Ft = fkine(withQ(ex.truth, ex.qRef));
  const tol = MODEL_TOL.dist * sizeK(ex);
  const items = [];
  for (let j = 0; j < n; j++) {
    items.push({ key: `type${j + 1}`, kind: 'type', joint: j + 1, ok: student[j].type === ex.truth[j].type });
    // Joint j+1 turns about z_j, the z-axis of frame {j}.
    const e = axisError(pos(Fs[j]), axis(Fs[j], 2), pos(Ft[j]), axis(Ft[j], 2));
    items.push({ key: `axis${j + 1}`, kind: 'axis', joint: j + 1, ok: e.angle <= MODEL_TOL.ang && e.dist <= tol, ...e });
  }
  const t = poseError(Fs[n], Ft[n]);
  items.push({ key: 'tool', kind: 'tool', ok: t.dp <= tol && t.dr <= MODEL_TOL.ang, ...t });
  return { ok: items.every((i) => i.ok), items };
}

export function checkReach(ex, joints, q) {
  const { dp, dr } = poseError(fkine(withQ(joints, q)).at(-1), ex.target);
  return { dp, dr, ok: dp <= REACH_TOL.dist * sizeK(ex) && dr <= REACH_TOL.ang };
}

/* ------------------------------------------------------------------- hints */

export const mm = (m) => `${fmtNum(m * 1000, 0)} mm`;
export const degStr = (r) => `${fmtNum(toDeg(r), 1)}°`;

/** A joint value as text: angles in the chosen units, lengths in metres. */
export const qText = (joint, v, units) => (joint.type === 'R' ? angleLabel(v, units, 0) : `${fmtNum(v, 2)} m`);

/** Advice for the first thing that is wrong in a model check (null when all is right). */
export function modelHint(ex, check) {
  const bad = check.items.find((i) => !i.ok);
  if (!bad) return null;
  const n = ex.truth.length;
  if (bad.kind === 'count') return `This robot has ${n} joints, so the table needs ${n} rows.`;
  if (bad.kind === 'type') {
    const P_ = ex.truth[bad.joint - 1].type === 'P';
    return `Joint ${bad.joint} is ${P_ ? 'prismatic: the drawing shows a sliding square sleeve' : 'revolute: the drawing shows a cylinder'}. Set its type to ${P_ ? 'P' : 'R'}.`;
  }
  if (bad.kind === 'axis') {
    const row = bad.joint - 1; // z_{row} is placed by row `row`
    if (bad.angle <= MODEL_TOL.ang) {
      return `Joint ${bad.joint}'s axis points the right way but sits ${mm(bad.dist)} from the drawn axis. It is z${row}, placed by row ${row}: check d and a there (θ or offset swings a around).`;
    }
    if (bad.angle >= PI - MODEL_TOL.ang) {
      return `Joint ${bad.joint}'s axis lies on the right line but points the opposite way to its arrow in the drawing. In row ${row}, change the sign of α (or add 180°).`;
    }
    return `Joint ${bad.joint}'s axis is ${degStr(bad.angle)} off. Its direction z${row} comes from row ${row}: check the twist α and θ/offset there.`;
  }
  return `All joint axes are right. The tool frame {${n}} is off by ${mm(bad.dp)} and ${degStr(bad.dr)}: check the last row (d, a, α) and the θ offset of joint ${n}.`;
}

/** Each hint reveals one more joint value of a solution. */
export function reachHint(ex, count, units) {
  const k = Math.min(Math.max(count, 1), ex.qTarget.length);
  const parts = ex.qTarget.slice(0, k).map((v, i) => `q${i + 1} = ${qText(ex.truth[i], v, units)}`);
  return `One solution has ${parts.join(', ')}.`;
}
