import { useEffect, useState } from 'react';
import { clamp, PI } from '../lib/dh.js';
import { instantiatePreset, makeJoint, PRESETS } from '../lib/presets.js';

const KEY = 'dh-robot-v1';

export const DEFAULT_OPTS = { matlabStyle: 'named', qlimRevolute: true, demo: true };

export function defaultRobot() {
  return {
    units: 'deg',
    opts: { ...DEFAULT_OPTS },
    ...instantiatePreset(PRESETS.find((p) => p.id === 'puma')),
  };
}

function isJoint(j) {
  return (
    j &&
    (j.type === 'R' || j.type === 'P') &&
    ['theta', 'd', 'a', 'alpha', 'offset', 'q'].every((k) => Number.isFinite(j[k])) &&
    Array.isArray(j.qlim) &&
    j.qlim.length === 2 &&
    typeof j.id === 'string'
  );
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.joints) && s.joints.every(isJoint)) {
      // Older saves carried a DH convention; the builder is standard DH only now.
      const { convention, ...saved } = s; // eslint-disable-line no-unused-vars
      return { ...defaultRobot(), ...saved, opts: { ...DEFAULT_OPTS, ...s.opts } };
    }
  } catch {
    /* storage unavailable or corrupt */
  }
  return defaultRobot();
}

/** Builder state, remembered in this browser between visits. */
export function useRobotState() {
  const [robot, setRobot] = useState(load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(robot));
    } catch {
      /* storage unavailable */
    }
  }, [robot]);
  return [robot, setRobot];
}

/** Keep q inside qlim (when qlim is a valid interval). */
export function normalizeJoint(j) {
  const [lo, hi] = j.qlim;
  return lo < hi ? { ...j, q: clamp(j.q, lo, hi) } : j;
}

/** Joint changing type: the old joint variable becomes a constant and vice versa. */
export function withType(j, type) {
  if (j.type === type) return j;
  return type === 'R'
    ? { ...j, type, theta: 0, offset: 0, qlim: [-PI, PI], q: 0 }
    : { ...j, type, d: 0, offset: 0, qlim: [0, 0.5], q: 0.2 };
}

/** A link from the Learn tab appended as a new joint. */
export function jointFromLink(p) {
  return p.type === 'R'
    ? makeJoint('R', { d: p.d, a: p.a, alpha: p.alpha, q: p.theta, qlim: [-PI, PI] })
    : makeJoint('P', { theta: p.theta, a: p.a, alpha: p.alpha, q: p.d, qlim: [Math.min(0, p.d), Math.max(1, p.d)] });
}
