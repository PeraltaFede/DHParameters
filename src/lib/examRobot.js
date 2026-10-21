// Robots for the Robot exam: three revolute joints whose axes and links all run along world
// axes, as in a paper exam, with joint 1 upright as on a usual robot. Each robot comes from a
// seed made from the student ID, so the same ID gets the same robot on any computer, and the
// teacher can rebuild it by typing the ID.
//
// Keep makeExamRobot deterministic. Changing it (or EXAM_SALT) changes every student's robot,
// so only do that between exam sessions. Coordinates are snapped to a 1e-9 m grid so that
// tiny differences in Math.sin/cos between browsers can't change which robot is accepted.
import { add, axis, clamp, cross, dot, fkine, identity, norm, normalize, pos, scale, sub, toRad } from './dh.js';
import { angleExpr, fmtNum } from './format.js';
import { R } from './presets.js';

/** Change for a new exam session: every student ID then gets a new robot. */
export const EXAM_SALT = 'ULA-2026';

/** The six world directions a frame axis can take. */
export const DIRS = {
  '+X': [1, 0, 0],
  '-X': [-1, 0, 0],
  '+Y': [0, 1, 0],
  '-Y': [0, -1, 0],
  '+Z': [0, 0, 1],
  '-Z': [0, 0, -1],
};
export const DIR_KEYS = Object.keys(DIRS);

/** 32-bit FNV-1a hash of a string. */
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Seed of exercise `exId` for a student ID. */
export const examSeed = (id, exId) => fnv1a(`${EXAM_SALT}|${exId}|${String(id).trim()}`);

/** Small seeded random generator (mulberry32): numbers in [0, 1), the same sequence for the same seed. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------- generation */

const MAX_TRIES = 4000;
const LENGTHS = [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5];
const TOL = 1e-9;
const GAP = {
  points: 0.2, // between joint centres and the tip
  links: 0.08, // between links that are not neighbours
  joint: 0.12, // from a joint centre to links not attached to it
  tip: 0.1, // from the tip to links not ending there
  span: 0.4, // the whole robot, along its longest world axis
};

const pick = (rnd, list) => list[Math.floor(rnd() * list.length)];
const snap = (v) => Math.round(v * 1e9) / 1e9 + 0; // + 0 turns -0 into 0
const snapV = (p) => p.map(snap);

/**
 * Base frame {0} at the origin with joint 1 upright, as on a usual robot: z0 = +Z, and x0 along
 * one of the four horizontal world directions (the robot turned about the vertical).
 */
function baseFrame(rnd) {
  const z = DIRS['+Z'];
  const x = DIRS[pick(rnd, ['+X', '-X', '+Y', '-Y'])];
  const y = cross(z, x);
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, 0, 0, 0, 1].map(snap);
}

/**
 * Random DH rows: twists of 0/±90° (none on the last link), lengths on a 0.05 m grid, θ in 90° steps.
 * worldBase: frame {0} is the world frame (the toolbox's default base) instead of a random turn.
 * zeroPose: every θ is 0, so the robot stands in its zero pose (the θ draw still happens, so the
 * other values stay as they were).
 */
function candidate(rnd, worldBase, zeroPose) {
  const base = worldBase ? identity() : baseFrame(rnd);
  const rows = [0, 1, 2].map((k) => {
    const alpha = k < 2 ? pick(rnd, [0, 90, -90]) : 0;
    const theta = pick(rnd, [0, 90, 180, -90]);
    const d = rnd() < 0.4 ? 0 : (rnd() < 0.5 ? -1 : 1) * pick(rnd, LENGTHS);
    const a = rnd() < 0.4 ? 0 : pick(rnd, LENGTHS);
    return { d, a, alpha, theta: zeroPose ? 0 : theta };
  });
  return { base, rows };
}

/**
 * The robot drawn at the generated pose. points: frame origins O0..O3 (joints 1-3 and the tip);
 * elbows: where each link turns from d (along z_{j-1}) to a (along x_j).
 */
export function buildExamRobot({ base, rows }) {
  // The drawn θ is stored as the joint value q, so the joints draw as they are at that pose.
  const joints = rows.map((r, k) => ({ ...R(r.d, r.a, r.alpha, { qDeg: r.theta }), id: `e${k + 1}` }));
  const frames = fkine(joints, base).map((T) => T.map(snap));
  const points = frames.map(pos);
  const elbows = joints.map((j, i) => snapV(add(points[i], scale(axis(frames[i], 2), j.d))));
  const segs = [];
  joints.forEach((_, i) => {
    segs.push([points[i], elbows[i]], [elbows[i], points[i + 1]]);
  });
  return { rows, base, joints, frames, points, elbows, segs: segs.filter(([p, q]) => norm(sub(q, p)) > TOL), s: 1 };
}

/** Distance between the segments p1-q1 and p2-q2 (Ericson, Real-Time Collision Detection 5.1.9). */
function segDist(p1, q1, p2, q2) {
  const d1 = sub(q1, p1);
  const d2 = sub(q2, p2);
  const r = sub(p1, p2);
  const a = dot(d1, d1);
  const e = dot(d2, d2);
  const f = dot(d2, r);
  let s = 0;
  let t = 0;
  if (a <= TOL && e <= TOL) return norm(r);
  if (a <= TOL) {
    t = clamp(f / e, 0, 1);
  } else {
    const c = dot(d1, r);
    if (e <= TOL) {
      s = clamp(-c / a, 0, 1);
    } else {
      const b = dot(d1, d2);
      const denom = a * e - b * b;
      s = denom > TOL ? clamp((b * f - c * e) / denom, 0, 1) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = clamp(-c / a, 0, 1);
      } else if (t > 1) {
        t = 1;
        s = clamp((b - c) / a, 0, 1);
      }
    }
  }
  return norm(sub(add(p1, scale(d1, s)), add(p2, scale(d2, t))));
}

const same = (p, q) => norm(sub(p, q)) < TOL;

/** Is this a clear, well-posed exam robot? */
export function isGoodRobot({ rows, points, elbows, segs }) {
  const [r1, r2] = rows;
  // Joints 1-2 or 2-3 on one line (no twist, no length) can't be told apart.
  if ((r1.alpha === 0 && r1.a === 0) || (r2.alpha === 0 && r2.a === 0)) return false;
  // All axes parallel would be a planar robot.
  if (r1.alpha === 0 && r2.alpha === 0) return false;
  const lengths = rows.flatMap((r) => [r.d, r.a]).filter((x) => x !== 0).length;
  if (lengths < 3 || lengths > 5) return false;
  const all = [...points, ...elbows];
  // Nothing below joint 1, so the base and the floor stay clear.
  if (all.some((p) => p[2] < -TOL)) return false;
  // Not cramped: at least GAP.span across in some direction.
  const span = Math.max(...[0, 1, 2].map((c) => Math.max(...all.map((p) => p[c])) - Math.min(...all.map((p) => p[c]))));
  if (span < GAP.span - TOL) return false;
  for (let i = 0; i < points.length; i++) {
    for (let k = i + 1; k < points.length; k++) {
      if (norm(sub(points[i], points[k])) < GAP.points - TOL) return false;
    }
  }
  for (let i = 0; i < segs.length; i++) {
    for (let k = i + 1; k < segs.length; k++) {
      if (k === i + 1) {
        // Neighbouring links meet at 90° or continue straight, never fold back.
        const u = normalize(sub(segs[i][1], segs[i][0]));
        const v = normalize(sub(segs[k][1], segs[k][0]));
        if (dot(u, v) < -0.5) return false;
      } else if (segDist(segs[i][0], segs[i][1], segs[k][0], segs[k][1]) < GAP.links - TOL) {
        return false;
      }
    }
  }
  // No link runs through a joint (or the tip) it isn't attached to.
  return points.every((p, k) =>
    segs.every(([a, b]) => same(a, p) || same(b, p) || segDist(p, p, a, b) >= (k < 3 ? GAP.joint : GAP.tip) - TOL),
  );
}

/** A known good robot, in case no random one passes (never seen in testing). */
const FALLBACK = {
  base: identity(),
  rows: [
    { d: 0.4, a: 0, alpha: 90, theta: 0 },
    { d: 0, a: 0.35, alpha: 0, theta: 0 },
    { d: 0.2, a: 0.3, alpha: 0, theta: -90 },
  ],
};

/**
 * The exam robot for a seed: { rows, joints, frames, points, elbows, s, ... }. Joint 1 always stands
 * upright. worldBase: frame {0} = world frame, as for a robot built from code (Exercise 2).
 */
export function makeExamRobot(seed, { worldBase = false, zeroPose = false } = {}) {
  const rnd = mulberry32(seed);
  for (let tries = 0; tries < MAX_TRIES; tries++) {
    const robot = buildExamRobot(candidate(rnd, worldBase, zeroPose));
    if (isGoodRobot(robot)) return { ...robot, tries: tries + 1 };
  }
  return { ...buildExamRobot(FALLBACK), tries: 0 };
}

/**
 * The MATLAB code given in Exercise 2: Revolute links, the SerialLink and the pose to draw
 * (θ of each row as q). No comments: they would be help.
 */
export function examMatlab({ rows }) {
  const len = (x) => fmtNum(x, 4);
  return [
    ...rows.map((r, k) => `L(${k + 1}) = Revolute('d', ${len(r.d)}, 'a', ${len(r.a)}, 'alpha', ${angleExpr(toRad(r.alpha))});`),
    "robot = SerialLink(L, 'name', 'exam');",
    ...(rows.every((r) => r.theta === 0)
      ? ['robot.plot([0 0 0])']
      : [`q = [${rows.map((r) => angleExpr(toRad(r.theta))).join(' ')}];`, 'robot.plot(q)']),
  ].join('\n');
}
