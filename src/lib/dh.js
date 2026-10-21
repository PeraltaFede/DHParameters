// Denavit–Hartenberg kinematics, RVC (Corke) notation.
// Homogeneous transforms are flat, row-major arrays of 16 numbers.

export const PI = Math.PI;
export const toRad = (deg) => (deg * PI) / 180;
export const toDeg = (rad) => (rad * 180) / PI;
export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const lerp = (a, b, k) => a + (b - a) * k;

/** Wrap an angle to (-pi, pi]. */
export function wrapPi(t) {
  let r = (t + PI) % (2 * PI);
  if (r < 0) r += 2 * PI;
  return r - PI;
}

/* ---------- 3-vectors ---------- */
export const add = (u, v) => [u[0] + v[0], u[1] + v[1], u[2] + v[2]];
export const sub = (u, v) => [u[0] - v[0], u[1] - v[1], u[2] - v[2]];
export const scale = (u, k) => [u[0] * k, u[1] * k, u[2] * k];
export const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
export const cross = (u, v) => [
  u[1] * v[2] - u[2] * v[1],
  u[2] * v[0] - u[0] * v[2],
  u[0] * v[1] - u[1] * v[0],
];
export const norm = (u) => Math.hypot(u[0], u[1], u[2]);
export function normalize(u) {
  const n = norm(u);
  return n < 1e-12 ? [0, 0, 0] : scale(u, 1 / n);
}

/* ---------- 4x4 homogeneous transforms ---------- */
export const identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export function mul(A, B) {
  const C = new Array(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += A[r * 4 + k] * B[k * 4 + c];
      C[r * 4 + c] = s;
    }
  }
  return C;
}

export const chain = (...Ts) => Ts.reduce((acc, T) => mul(acc, T), identity());

export function Rz(t) {
  const c = Math.cos(t), s = Math.sin(t);
  return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
export function Rx(t) {
  const c = Math.cos(t), s = Math.sin(t);
  return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1];
}
export const Tz = (d) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, d, 0, 0, 0, 1];
export const Tx = (a) => [1, 0, 0, a, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** Origin of a transform. */
export const pos = (T) => [T[3], T[7], T[11]];
/** Column i (0 = x, 1 = y, 2 = z) of the rotation part. */
export const axis = (T, i) => [T[i], T[4 + i], T[8 + i]];

/** Standard DH (RVC):  A_j = Rz(theta_j) Tz(d_j) Tx(a_j) Rx(alpha_j) */
export const linkStd = ({ theta, d, a, alpha }) => chain(Rz(theta), Tz(d), Tx(a), Rx(alpha));

/** Standard DH link transform built up to `s` in [0, 4] elementary steps. */
export function linkStdPartial({ theta, d, a, alpha }, s) {
  const f = (i) => clamp(s - i, 0, 1);
  return chain(Rz(theta * f(0)), Tz(d * f(1)), Tx(a * f(2)), Rx(alpha * f(3)));
}

/**
 * Effective DH parameters of a builder joint at its current coordinate q.
 * As in the Robotics Toolbox: theta = q + offset (revolute), d = q + offset (prismatic).
 */
export function jointParams(j) {
  const q = j.q ?? 0;
  return j.type === 'R'
    ? { theta: q + j.offset, d: j.d, a: j.a, alpha: j.alpha }
    : { theta: j.theta, d: q + j.offset, a: j.a, alpha: j.alpha };
}

/** Frames {0}..{n} of a serial chain (standard DH), as world transforms; `base` is frame {0}. */
export function fkine(joints, base = identity()) {
  const frames = [base];
  for (const j of joints) frames.push(mul(frames[frames.length - 1], linkStd(jointParams(j))));
  return frames;
}

/** The same joints at the joint coordinates q. */
export const withQ = (joints, q) => joints.map((j, i) => ({ ...j, q: q[i] }));

/** Characteristic size of a robot, independent of its pose. */
export function robotScale(joints) {
  const s = joints.reduce(
    (acc, j) => acc + Math.abs(j.a) + (j.type === 'P' ? Math.max(Math.abs(j.qlim[0]), Math.abs(j.qlim[1])) : Math.abs(j.d)),
    0,
  );
  return Math.min(Math.max(s, 0.5), 6);
}

/** Distance between the origins and angle of the relative rotation of two poses. */
export function poseError(A, B) {
  let tr = 0; // trace(R_A' R_B)
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) tr += A[r * 4 + c] * B[r * 4 + c];
  return { dp: norm(sub(pos(A), pos(B))), dr: Math.acos(clamp((tr - 1) / 2, -1, 1)) };
}

/**
 * How far the directed line (p, u) is from the directed line (p0, u0):
 * the angle between the directions (0..pi) and the distance of p from the second line.
 */
export function axisError(p, u, p0, u0) {
  const v = normalize(u0);
  return {
    angle: Math.acos(clamp(dot(normalize(u), v), -1, 1)),
    dist: norm(cross(sub(p, p0), v)),
  };
}
