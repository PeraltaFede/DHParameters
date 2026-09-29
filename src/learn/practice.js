import { toRad, wrapPi } from '../lib/dh.js';

const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];

/** A random target on the practice sliders' grid (5 deg, 0.05 m), so an exact match exists. */
export function newPracticeTarget(prev) {
  let tgt;
  do {
    tgt = {
      type: 'R',
      theta: toRad(pick([-135, -90, -60, -45, -30, 30, 45, 60, 90, 120, 150])),
      d: pick([0, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8]),
      a: pick([0.3, 0.4, 0.5, 0.6, 0.8, 1.0]),
      alpha: toRad(pick([-90, -60, -45, 0, 30, 45, 60, 90, 180])),
    };
  } while (prev && Math.abs(tgt.theta - prev.theta) < 1e-9 && Math.abs(tgt.alpha - prev.alpha) < 1e-9);
  return tgt;
}

const TOL = { theta: toRad(2.5), d: 0.025, a: 0.025, alpha: toRad(2.5) };
export const ORDER = ['theta', 'd', 'a', 'alpha'];

export function compare(user, target) {
  const diff = {
    theta: wrapPi(target.theta - user.theta),
    d: target.d - user.d,
    a: target.a - user.a,
    alpha: wrapPi(target.alpha - user.alpha),
  };
  const ok = Object.fromEntries(ORDER.map((k) => [k, Math.abs(diff[k]) < TOL[k]]));
  return { diff, ok, all: ORDER.every((k) => ok[k]) };
}

/** The first wrong parameter, in the order the link transform applies them. */
export function nextHint(cmp) {
  const key = ORDER.find((k) => !cmp.ok[k]);
  return key ? { key, more: cmp.diff[key] > 0 } : null;
}
